"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { ActionResult } from "@/actions/leads";
import { createAndSendQuoteSchema, markQuoteResponseSchema } from "../validation/quote-schemas";
import { resolveSalesCrmViewer } from "../server/rbac";
import { createNotification } from "@/features/notifications/server/creation";

async function actorTeamMember(userId: string) {
  return prisma.teamMember.findUnique({ where: { userId } });
}

/** Non-terminal, pre-proposal statuses - sending a quote always moves the lead at least this far forward, never backward (a lead already in NEGOTIATION/WON/LOST/ON_HOLD keeps its status). */
const EARLY_PIPELINE_STATUSES = ["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "MEETING_SCHEDULED"];

function buildQuoteEmailHtml(params: {
  salesperson: string;
  businessName: string;
  ownerName: string;
  title: string;
  quotedAmount: number;
  standardAmount: number | null;
  currency: string;
  message?: string;
  /** Set only when the lead's contact already has a CLIENT portal account - gives them a real in-app place to respond instead of "reply to this email". */
  portalLink?: string;
}) {
  const quotedFormatted = formatPrice(params.quotedAmount, params.currency);
  const standardLine =
    params.standardAmount && params.standardAmount > params.quotedAmount
      ? `<p style="color:#6b7280;text-decoration:line-through;margin:0 0 4px;font-size:14px;">${formatPrice(params.standardAmount, params.currency)}</p>`
      : "";
  const messageHtml = params.message ? `<p style="color:#374151;line-height:1.6;">${params.message.replace(/\n/g, "<br/>")}</p>` : "";
  const portalCta = params.portalLink
    ? `<p style="margin-top:24px;"><a href="${params.portalLink}" style="display:inline-block;background:#111827;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View & respond in your dashboard</a></p>`
    : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
      <p>Hi ${params.ownerName},</p>
      <p>Thank you for your interest in working with Stively. Here's the quote we discussed for <strong>${params.businessName}</strong>:</p>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:24px 0;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">${params.title}</p>
        ${standardLine}
        <p style="font-size:28px;font-weight:600;margin:0;">${quotedFormatted}</p>
      </div>
      ${messageHtml}
      ${portalCta}
      <p>Feel free to reply to this email or call us with any questions.</p>
      <p style="margin-top:32px;">Best regards,<br/>${params.salesperson}<br/>Stively</p>
    </div>
  `;
}

export type CreateAndSendQuoteResult = ActionResult & { emailSent?: boolean };

/**
 * Creates a real SalesQuote row and emails the client via Resend - the
 * "send a custom negotiated quote" workflow. offeringId is optional: when
 * given, its list price is snapshotted as standardAmount purely for an
 * honest "was ₹X" comparison in the email; quotedAmount is always the real
 * negotiated number, never derived from it. Sending a quote nudges an
 * early-pipeline lead forward to PROPOSAL_SENT.
 */
export async function createAndSendQuote(input: unknown): Promise<CreateAndSendQuoteResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = createAndSendQuoteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: data.salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    let standardAmount: number | null = null;
    if (data.offeringId) {
      const offering = await prisma.offering.findUnique({ where: { id: data.offeringId }, select: { price: true } });
      standardAmount = offering?.price ?? null;
    }

    const actor = await actorTeamMember(user.id);

    await prisma.$transaction(async (tx) => {
      await tx.salesQuote.create({
        data: {
          salesLeadId: data.salesLeadId,
          offeringId: data.offeringId,
          title: data.title,
          standardAmount,
          quotedAmount: data.quotedAmount,
          message: data.message,
          createdById: actor?.id,
        },
      });
      await tx.salesLeadActivity.create({
        data: {
          salesLeadId: data.salesLeadId,
          type: "QUOTE_SENT",
          description: `${data.title} - ${formatPrice(data.quotedAmount)}`,
          performedById: actor?.id ?? null,
        },
      });
      if (EARLY_PIPELINE_STATUSES.includes(lead.status)) {
        await tx.salesLead.update({ where: { id: data.salesLeadId }, data: { status: "PROPOSAL_SENT" } });
      }
    });

    const portalLink = lead.clientUserId ? `${siteConfig.url}/client/projects/${lead.id}` : undefined;

    let emailSent = false;
    if (lead.email) {
      try {
        const html = buildQuoteEmailHtml({
          salesperson: actor?.name ?? "The Stively Team",
          businessName: lead.businessName,
          ownerName: lead.ownerName,
          title: data.title,
          quotedAmount: data.quotedAmount,
          standardAmount,
          currency: "INR",
          message: data.message,
          portalLink,
        });
        await resend.emails.send({ from: EMAIL_FROM, to: lead.email, subject: `Your quote from Stively - ${data.title}`, html });
        emailSent = true;
      } catch (error) {
        console.error("createAndSendQuote email failed:", error);
      }
    }

    if (lead.clientUserId) {
      await createNotification({
        userId: lead.clientUserId,
        type: "SALES_QUOTE_SENT",
        title: `New quote: ${data.title}`,
        body: formatPrice(data.quotedAmount),
        link: `/client/projects/${lead.id}`,
      }).catch((error) => console.error("createAndSendQuote notification failed:", error));
    }

    revalidatePath(`/admin/sales-crm/leads/${data.salesLeadId}`);
    revalidatePath(`/sales/leads/${data.salesLeadId}`);
    revalidatePath(`/client/projects/${lead.id}`);
    return { success: true, emailSent };
  } catch (error) {
    console.error("createAndSendQuote failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Admin manually records the client's response after a call/email - stays available alongside the client's own in-portal Accept/Decline (client-workspace/actions/quote-actions.ts's respondToQuote); whichever happens first wins, since SENT->ACCEPTED/REJECTED is a one-way transition. */
export async function markQuoteResponse(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = markQuoteResponseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const quote = await prisma.salesQuote.findUnique({ where: { id: data.quoteId }, include: { salesLead: true } });
    if (!quote) return { success: false, error: "Quote not found." };
    if (quote.status !== "SENT") return { success: false, error: "This quote has already been responded to." };

    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    if (!viewer.hasFullAccess && quote.salesLead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Quote not found." };
    }

    const actor = await actorTeamMember(user.id);

    await prisma.$transaction([
      prisma.salesQuote.update({ where: { id: data.quoteId }, data: { status: data.status, respondedAt: new Date() } }),
      prisma.salesLeadActivity.create({
        data: {
          salesLeadId: quote.salesLeadId,
          type: data.status === "ACCEPTED" ? "QUOTE_ACCEPTED" : "QUOTE_REJECTED",
          description: quote.title,
          performedById: actor?.id ?? null,
        },
      }),
    ]);

    revalidatePath(`/admin/sales-crm/leads/${quote.salesLeadId}`);
    revalidatePath(`/sales/leads/${quote.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("markQuoteResponse failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
