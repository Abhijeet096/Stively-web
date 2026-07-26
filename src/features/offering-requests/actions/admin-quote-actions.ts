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
 */

export async function approveCustomQuote(input: unknown): Promise<ActionResult> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = reviewCustomQuoteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { requestId, approvedAmount } = parsed.data;

  try {
    const current = await prisma.offeringRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { email: true, name: true, role: true } }, offering: { select: { title: true } } },
    });
    if (!current) return { success: false, error: "Request not found." };
    if (current.quoteStatus !== "PENDING") {
      return { success: false, error: "There's no pending proposal to approve." };
    }

    const actor = await prisma.teamMember.findUnique({ where: { userId: admin.id } });

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

    const basePath = current.user.role === "CLIENT" ? "/client/requests" : "/student/requests";
    const link = `${basePath}/${requestId}`;

    try {
      await createNotification({
        userId: current.userId,
        type: "QUOTE_APPROVED",
        title: "Your quote was approved",
        body: `${formatPrice(approvedAmount)} for ${current.offering.title} - you can pay now to get started.`,
        link,
      });
    } catch (error) {
      console.error("createNotification (QUOTE_APPROVED) failed:", error);
    }

    if (current.user.email) {
      try {
        const greeting = current.user.name ? `Hi ${current.user.name},` : "Hi there,";
        const html = `<p>${greeting}</p><p>Good news - your proposed price for <strong>${current.offering.title}</strong> has been approved at <strong>${formatPrice(approvedAmount)}</strong>. Pay now to get your project started.</p><p><a href="${siteConfig.url}${link}">View your request and pay</a></p>`;
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
