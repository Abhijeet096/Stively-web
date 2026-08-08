"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { ActionResult } from "@/actions/leads";
import { createNotification } from "@/features/notifications/server/creation";
import { reviewCustomQuoteSchema, rejectCustomQuoteSchema } from "../validation/quote-schemas";
import { emitOfferingRequestEvent } from "../lib/events";

/**
 * Admin review of a client's proposed price (see proposeCustomQuote in
 * client-quote-actions.ts). Mirrors approveRequest/rejectRequest's shape
 * but deliberately does NOT touch `status` (the overall admin review
 * pipeline) - a price negotiation is independent of that pipeline, and
 * mutating status here would risk double-firing approveRequest's own
 * createEnrollmentFromRequest on an unrelated status transition.
 *
 * For a CLIENT-role request, approval also bridges it into the Sales CRM
 * (SalesLead -> SalesProject -> first SalesProjectPayment installment) so
 * this client gets the exact same rich Client Workspace - chat, meetings,
 * quotes, documents, progress, real installments - a cold-called SalesLead
 * already gets, instead of the old single-shot Order payment. STUDENT-role
 * requests are completely untouched: no SalesLead/Client Workspace concept
 * exists for students, so they keep today's exact behavior.
 */

function readWizardString(details: unknown, key: string): string | undefined {
  if (!details || typeof details !== "object") return undefined;
  const value = (details as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function approveCustomQuote(input: unknown): Promise<ActionResult> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = reviewCustomQuoteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { requestId, approvedAmount, phone, paymentPercent } = parsed.data;

  try {
    const current = await prisma.offeringRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { id: true, email: true, name: true, role: true } }, offering: { select: { title: true, price: true } } },
    });
    if (!current) return { success: false, error: "Request not found." };
    if (current.quoteStatus !== "PENDING") {
      return { success: false, error: "There's no pending proposal to approve." };
    }
    if (current.user.role === "CLIENT" && (!phone || !paymentPercent)) {
      return { success: false, error: "Enter a phone number and the payment percentage to collect now." };
    }

    const actor = await prisma.teamMember.findUnique({ where: { userId: admin.id } });

    let salesLeadId: string | undefined;

    if (current.user.role === "CLIENT" && phone && paymentPercent) {
      const businessName = readWizardString(current.details, "companyName") ?? current.user.name ?? "Unknown business";
      const advanceAmount = Math.round((approvedAmount * paymentPercent) / 100);

      salesLeadId = await prisma.$transaction(async (tx) => {
        const lead = await tx.salesLead.create({
          data: {
            businessName,
            ownerName: current.user.name ?? businessName,
            industry: readWizardString(current.details, "industry"),
            phone,
            email: current.user.email,
            source: "OFFERING_REQUEST",
            status: "WON",
            createdById: actor?.id,
            clientUserId: current.user.id,
          },
        });
        await tx.salesLeadActivity.create({
          data: { salesLeadId: lead.id, type: "LEAD_CREATED", performedById: actor?.id ?? null, description: `From ${current.offering.title} request` },
        });
        await tx.salesLeadActivity.create({
          data: { salesLeadId: lead.id, type: "CLIENT_ACCOUNT_INVITED", performedById: actor?.id ?? null, description: "Already had a Stively account - linked directly" },
        });

        const project = await tx.salesProject.create({
          data: {
            salesLeadId: lead.id,
            clientName: businessName,
            totalValue: approvedAmount,
            description: current.offering.title,
          },
        });
        await tx.salesLeadActivity.create({
          data: { salesLeadId: lead.id, type: "PROJECT_CREATED", performedById: actor?.id ?? null },
        });

        await tx.salesProjectPayment.create({
          data: {
            salesProjectId: project.id,
            amount: advanceAmount,
            label: `Advance Payment (${paymentPercent}%)`,
          },
        });

        // The client's own proposed price already went through a real
        // negotiation (proposeCustomQuote -> this approval) - record it as
        // a real SalesQuote too, already ACCEPTED, so it shows up in the
        // Client Workspace's Quotes tab exactly like a cold-called lead's
        // quote history would. Without this, the negotiated price/note is
        // only ever visible on the OfferingRequest admin view - the
        // client's own portal (which reads SalesQuote, not OfferingRequest)
        // showed "No quotes yet" despite a real, approved price existing.
        const standardAmount =
          current.offering.price != null && current.offering.price > approvedAmount
            ? current.offering.price
            : null;
        const quote = await tx.salesQuote.create({
          data: {
            salesLeadId: lead.id,
            offeringId: current.offeringId,
            title: current.offering.title,
            standardAmount,
            quotedAmount: approvedAmount,
            message: current.proposedMessage,
            status: "ACCEPTED",
            respondedAt: new Date(),
            createdById: actor?.id,
          },
        });
        await tx.salesLeadActivity.create({
          data: {
            salesLeadId: lead.id,
            type: "QUOTE_ACCEPTED",
            performedById: actor?.id ?? null,
            description: `${quote.title} - ${formatPrice(approvedAmount)} (negotiated via request wizard)`,
          },
        });

        await tx.offeringRequest.update({
          where: { id: requestId },
          data: {
            quoteStatus: "APPROVED",
            approvedAmount,
            quoteReviewedById: actor?.id,
            quoteReviewedAt: new Date(),
            quoteRejectionReason: null,
            promotedSalesLeadId: lead.id,
            history: {
              create: {
                eventType: "QUOTE_APPROVED",
                description: `Approved at ${formatPrice(approvedAmount)} - moved to your Client Workspace`,
                performedBy: admin.id,
              },
            },
          },
        });

        return lead.id;
      });
    } else {
      const updated = await prisma.offeringRequest.update({
        where: { id: requestId },
        data: {
          quoteStatus: "APPROVED",
          approvedAmount,
          quoteReviewedById: actor?.id,
          quoteReviewedAt: new Date(),
          quoteRejectionReason: null,
          history: {
            create: {
              eventType: "QUOTE_APPROVED",
              description: `Approved at ${formatPrice(approvedAmount)}`,
              performedBy: admin.id,
            },
          },
        },
      });
      emitOfferingRequestEvent("QUOTE_APPROVED", updated);
    }

    const link = salesLeadId
      ? `/client/projects/${salesLeadId}`
      : current.user.role === "CLIENT"
        ? `/client/requests/${requestId}`
        : `/student/requests/${requestId}`;

    try {
      await createNotification({
        userId: current.userId,
        type: "QUOTE_APPROVED",
        title: "Your quote was approved",
        body: salesLeadId
          ? `${formatPrice(approvedAmount)} for ${current.offering.title} - your project workspace is ready, with the first payment waiting.`
          : `${formatPrice(approvedAmount)} for ${current.offering.title} - you can pay now to get started.`,
        link,
      });
    } catch (error) {
      console.error("createNotification (QUOTE_APPROVED) failed:", error);
    }

    if (current.user.email) {
      try {
        const greeting = current.user.name ? `Hi ${current.user.name},` : "Hi there,";
        const html = salesLeadId
          ? `<p>${greeting}</p><p>Good news - your proposed price for <strong>${current.offering.title}</strong> has been approved at <strong>${formatPrice(approvedAmount)}</strong>. Your project workspace is ready - documents, payments, progress updates, and messages will all live there from now on.</p><p><a href="${siteConfig.url}${link}">Open your workspace</a></p>`
          : `<p>${greeting}</p><p>Good news - your proposed price for <strong>${current.offering.title}</strong> has been approved at <strong>${formatPrice(approvedAmount)}</strong>. Pay now to get your project started.</p><p><a href="${siteConfig.url}${link}">View your request and pay</a></p>`;
        await resend.emails.send({
          from: EMAIL_FROM,
          to: current.user.email,
          subject: `Your quote is approved - ${current.offering.title}`,
          html,
        });
      } catch (error) {
        console.error("approveCustomQuote email failed:", error);
      }
    }

    revalidatePath(`/student/requests/${requestId}`);
    revalidatePath(`/client/requests/${requestId}`);
    revalidatePath(`/admin/operations`);
    if (salesLeadId) {
      revalidatePath(`/client/projects/${salesLeadId}`);
      revalidatePath(`/admin/sales-crm/leads/${salesLeadId}`);
      revalidatePath("/admin/sales-crm/projects");
    }
    return { success: true };
  } catch (error) {
    console.error("approveCustomQuote failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function rejectCustomQuote(input: unknown): Promise<ActionResult> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = rejectCustomQuoteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { requestId, reason } = parsed.data;

  try {
    const current = await prisma.offeringRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { email: true, name: true, role: true } }, offering: { select: { title: true } } },
    });
    if (!current) return { success: false, error: "Request not found." };
    if (current.quoteStatus !== "PENDING") {
      return { success: false, error: "There's no pending proposal to reject." };
    }

    const actor = await prisma.teamMember.findUnique({ where: { userId: admin.id } });

    const updated = await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        quoteStatus: "REJECTED",
        quoteRejectionReason: reason,
        quoteReviewedById: actor?.id,
        quoteReviewedAt: new Date(),
        history: {
          create: { eventType: "QUOTE_REJECTED", description: reason, performedBy: admin.id },
        },
      },
    });
    emitOfferingRequestEvent("QUOTE_REJECTED", updated);

    const basePath = current.user.role === "CLIENT" ? "/client/requests" : "/student/requests";
    const link = `${basePath}/${requestId}`;

    try {
      await createNotification({
        userId: current.userId,
        type: "QUOTE_REJECTED",
        title: "Your quote proposal wasn't approved",
        body: reason ?? `We couldn't approve your proposed price for ${current.offering.title} - feel free to propose again.`,
        link,
      });
    } catch (error) {
      console.error("createNotification (QUOTE_REJECTED) failed:", error);
    }

    revalidatePath(`/student/requests/${requestId}`);
    revalidatePath(`/client/requests/${requestId}`);
    revalidatePath(`/admin/operations`);
    return { success: true };
  } catch (error) {
    console.error("rejectCustomQuote failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
