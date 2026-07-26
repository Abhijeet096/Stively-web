"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/actions/leads";
import { proposeCustomQuoteSchema } from "../validation/quote-schemas";
import { emitOfferingRequestEvent } from "../lib/events";

/**
 * The client-side half of the "client proposes a price, admin approves,
 * client pays" flow (see admin-quote-actions.ts for the admin half and
 * order-actions.ts's createOrderFromApprovedQuote for payment). Ownership
 * is re-checked from the session, never trusted from a client-supplied
 * userId - same discipline requireOwnedDraft (request-actions.ts) follows.
 *
 * Deliberately does NOT use requireRole: both STUDENT and CLIENT requests
 * can carry a price negotiation depending on the offering's audience, and
 * ownership (userId match) is the real guard here, not the caller's role.
 */
export async function proposeCustomQuote(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = proposeCustomQuoteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { requestId, proposedAmount, proposedMessage } = parsed.data;

  try {
    const request = await prisma.offeringRequest.findFirst({ where: { id: requestId, userId: session.user.id } });
    if (!request) return { success: false, error: "Request not found." };

    if (request.status === "DRAFT" || request.status === "CANCELLED") {
      return { success: false, error: "Submit your request before proposing a price." };
    }
    if (request.orderId) {
      return { success: false, error: "This request already has a payment attached." };
    }
    if (request.quoteStatus === "PENDING") {
      return { success: false, error: "You already have a proposal awaiting review." };
    }
    if (request.quoteStatus === "APPROVED") {
      return { success: false, error: "Your quote was already approved - pay it to continue." };
    }

    const updated = await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        proposedAmount,
        proposedMessage,
        quoteStatus: "PENDING",
        approvedAmount: null,
        quoteReviewedById: null,
        quoteReviewedAt: null,
        quoteRejectionReason: null,
        history: {
          create: { eventType: "QUOTE_PROPOSED", description: `Proposed ₹${(proposedAmount / 100).toLocaleString("en-IN")}` },
        },
      },
    });
    emitOfferingRequestEvent("QUOTE_PROPOSED", updated);

    revalidatePath(`/student/requests/${requestId}`);
    revalidatePath(`/client/requests/${requestId}`);
    return { success: true };
  } catch (error) {
    console.error("proposeCustomQuote failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
