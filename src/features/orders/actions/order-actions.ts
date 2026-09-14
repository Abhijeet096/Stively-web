"use server";

import { revalidatePath } from "next/cache";

import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/session";
import { createRazorpayOrder, verifyRazorpaySignature, describeRazorpayError } from "@/lib/razorpay";
import type { ActionResult } from "@/actions/leads";
import { emitOrderEvent } from "../lib/events";
import { handleOrderPaid } from "../server/post-purchase";

export type CreateOrderResult =
  | { success: true; orderId: string; alreadyPaid: true }
  | {
      success: true;
      orderId: string;
      alreadyPaid: false;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }
  | { success: false; error: string };

/**
 * Starts a direct-purchase checkout for an offering. Unlike
 * getOrCreateDraftRequest (offering-requests), this never resumes an
 * existing row - every "Buy Now" click is a fresh purchase attempt, so a
 * user can legitimately buy the same offering more than once (e.g. gifting
 * it, or a subscription renewal later).
 *
 * `promptsPack` mirrors createGuestOrder's identical add-on handling
 * (guest-checkout-actions.ts) - same one-fixed-optional-add-on shape
 * (Offering.promptsPackPrice / Order.addons), just reachable from the
 * normal authenticated checkout too, not only the guest-checkout flow.
 */
export async function createOrder(offeringId: string, phone?: string, promptsPack?: boolean): Promise<CreateOrderResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const offering = await prisma.offering.findFirst({
    where: { id: offeringId, status: "PUBLISHED", visible: true },
  });
  if (!offering) {
    return { success: false, error: "This offering is no longer available." };
  }
  if (offering.purchaseFlow !== "DIRECT_PAYMENT" && offering.purchaseFlow !== "BOTH") {
    return { success: false, error: "This offering isn't available for direct purchase." };
  }

  const role = session.user.role;
  const audienceAllows =
    (offering.audience === "STUDENT" && role === "STUDENT") ||
    (offering.audience === "BUSINESS" && role === "CLIENT") ||
    (offering.audience === "BOTH" && (role === "STUDENT" || role === "CLIENT"));
  if (!audienceAllows) {
    return { success: false, error: "This offering isn't available for your account type." };
  }

  if (offering.pricingType === "CUSTOM_QUOTE") {
    return { success: false, error: "This offering requires a custom quote - please request a proposal instead." };
  }

  // FREE offerings skip Razorpay entirely - a ₹0 order can't be created
  // there, and there's nothing to charge. The Order row itself (status
  // PAID from creation) is the access signal, same as a priced purchase.
  if (offering.pricingType === "FREE") {
    try {
      const order = await prisma.order.create({
        data: {
          offeringId: offering.id,
          userId: session.user.id,
          amount: 0,
          currency: offering.currency,
          status: "PAID",
          paidAt: new Date(),
          phone,
        },
      });
      emitOrderEvent("ORDER_PAID", order);

      // handleOrderPaid is the single idempotent gate every PAID transition
      // routes through now - see post-purchase.ts for why (operation item,
      // enrollment, notify email, WhatsApp, all in one non-throwing call).
      await handleOrderPaid(order.id);

      revalidatePath("/student/orders");
      revalidatePath("/client/orders");
      return { success: true, orderId: order.id, alreadyPaid: true };
    } catch (error) {
      console.error("createOrder (free) failed:", error);
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }

  const basePrice = offering.discountPrice ?? offering.price;
  if (basePrice == null) {
    return { success: false, error: "This offering doesn't have a price set yet." };
  }
  const wantsPromptsPack = promptsPack && offering.promptsPackPrice != null;
  const amount = basePrice + (wantsPromptsPack ? offering.promptsPackPrice! : 0);

  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
    // Logged distinctly from the catch below - both return the same
    // deliberately vague message to the buyer, but "no keys in this
    // environment" and "Razorpay rejected our keys" need very different
    // fixes, and are otherwise indistinguishable in production.
    console.error("createOrder: RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are not set in this environment.");
    return { success: false, error: "Payments aren't set up yet - please contact us directly." };
  }

  try {
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: amount,
      // Razorpay caps `receipt` at 40 characters - the full offeringId +
      // userId + timestamp this used to build ran to ~74 and was rejected
      // outright by their API (only surfaced once real keys were added;
      // with no keys configured this call never actually ran before). The
      // real traceable IDs still go in `notes`, which has no such limit.
      receipt: `ord_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`,
      notes: { offeringId: offering.id, userId: session.user.id },
    });

    const order = await prisma.order.create({
      data: {
        offeringId: offering.id,
        userId: session.user.id,
        amount,
        currency: offering.currency,
        status: "PENDING",
        razorpayOrderId: razorpayOrder.id,
        phone,
        addons: wantsPromptsPack ? { promptsPack: { purchased: true, price: offering.promptsPackPrice } } : undefined,
      },
    });

    return {
      success: true,
      orderId: order.id,
      alreadyPaid: false,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: offering.currency,
      keyId,
    };
  } catch (error) {
    console.error("createOrder (Razorpay) failed:", describeRazorpayError(error));
    return { success: false, error: "Payments aren't set up yet - please contact us directly." };
  }
}

/**
 * Pays an admin-approved custom quote (see proposeCustomQuote/
 * approveCustomQuote in offering-requests/actions). Reuses verifyPayment/
 * markOrderFailed/the webhook handler completely unchanged - they only
 * ever look at the Order row by id/userId/razorpayOrderId, with no
 * Offering-specific logic to diverge from a normal checkout. Idempotent:
 * a second call resumes the same linked Order (or reports alreadyPaid)
 * rather than creating a duplicate - OfferingRequest.orderId is @unique,
 * so a second Order row could never link anyway.
 */
export async function createOrderFromApprovedQuote(requestId: string, phone?: string): Promise<CreateOrderResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const request = await prisma.offeringRequest.findFirst({
    where: { id: requestId, userId: session.user.id },
    include: { offering: { select: { currency: true } }, order: true },
  });
  if (!request) {
    return { success: false, error: "Request not found." };
  }
  if (request.quoteStatus !== "APPROVED" || request.approvedAmount == null) {
    return { success: false, error: "This request doesn't have an approved quote to pay." };
  }

  if (request.order) {
    if (request.order.status === "PAID") {
      return { success: true, orderId: request.order.id, alreadyPaid: true };
    }
    if (request.order.status === "PENDING" && request.order.razorpayOrderId) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      if (!keyId) return { success: false, error: "Payments aren't set up yet - please contact us directly." };
      return {
        success: true,
        orderId: request.order.id,
        alreadyPaid: false,
        razorpayOrderId: request.order.razorpayOrderId,
        amount: request.order.amount,
        currency: request.order.currency,
        keyId,
      };
    }
  }

  const amount = request.approvedAmount;
  const currency = request.offering.currency;

  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
    return { success: false, error: "Payments aren't set up yet - please contact us directly." };
  }

  try {
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: amount,
      receipt: `qte_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`,
      notes: { offeringRequestId: request.id, userId: session.user.id },
    });

    // A previously FAILED attempt reuses the same linked Order row rather
    // than creating a second one - OfferingRequest.orderId is @unique, so a
    // second row could never link to this request anyway.
    const order = request.order
      ? await prisma.order.update({
          where: { id: request.order.id },
          data: { status: "PENDING", razorpayOrderId: razorpayOrder.id, razorpayPaymentId: null, razorpaySignature: null, phone },
        })
      : await prisma.order.create({
          data: {
            offeringId: request.offeringId,
            userId: session.user.id,
            amount,
            currency,
            status: "PENDING",
            razorpayOrderId: razorpayOrder.id,
            phone,
          },
        });

    if (!request.order) {
      await prisma.offeringRequest.update({ where: { id: requestId }, data: { orderId: order.id } });
    }

    return {
      success: true,
      orderId: order.id,
      alreadyPaid: false,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency,
      keyId,
    };
  } catch (error) {
    console.error("createOrderFromApprovedQuote (Razorpay) failed:", describeRazorpayError(error));
    return { success: false, error: "Payments aren't set up yet - please contact us directly." };
  }
}

export async function verifyPayment(
  orderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: session.user.id } });
  if (!order) {
    return { success: false, error: "Order not found." };
  }
  // Fast-path only, not the real race guard - the webhook can flip this
  // order to PAID between this read and the atomic claim below, and that's
  // fine (see the claim.count === 0 branch). This just gives a legitimate
  // double-submit (e.g. a re-rendered page re-firing the handler) a clean
  // "already processed" message without ever reaching Razorpay verification
  // again for an order genuinely still PENDING.
  if (order.status !== "PENDING") {
    return { success: false, error: "This order has already been processed." };
  }
  if (!order.razorpayOrderId) {
    return { success: false, error: "This order can't be verified." };
  }

  const isValid = verifyRazorpaySignature({
    orderId: order.razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!isValid) {
    // Deliberately does NOT mark the order FAILED - an invalid signature
    // could be a spoofed client call, not a real failed payment. Only the
    // webhook or an explicit Razorpay payment.failed event should do that.
    return { success: false, error: "Payment verification failed." };
  }

  try {
    // The real race guard: an atomic conditional update, not a read-then-
    // write. If the Razorpay webhook already won this exact race (it often
    // arrives before this client-side call even fires - see the webhook
    // route's own comment), claim.count is 0 here and nothing is
    // double-written - handleOrderPaid below is independently idempotent
    // either way, so this still safely converges on the same "done" state.
    const claim = await prisma.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "PAID", razorpayPaymentId, razorpaySignature, paidAt: new Date() },
    });

    if (claim.count === 0) {
      const current = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
      if (current?.status !== "PAID") {
        return { success: false, error: "This order has already been processed." };
      }
      // Already PAID by a concurrent caller (the webhook) with this same,
      // now-verified signature - a genuine success, not an error. Same
      // "already PAID is success, not a duplicate-processing error"
      // reasoning as verifyGuestPayment's own status === "PAID" branch.
    } else {
      emitOrderEvent("ORDER_PAID", { id: orderId, userId: order.userId, status: "PAID" });
    }

    await handleOrderPaid(orderId);

    revalidatePath("/student/orders");
    revalidatePath("/client/orders");
    return { success: true };
  } catch (error) {
    console.error("verifyPayment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function markOrderFailed(orderId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: session.user.id } });
  if (!order || order.status !== "PENDING") {
    return { success: true }; // nothing to do - already resolved or not found
  }

  try {
    const updated = await prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } });
    emitOrderEvent("ORDER_FAILED", updated);
    return { success: true };
  } catch (error) {
    console.error("markOrderFailed failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}

/**
 * Operations-driven status change (e.g. marking an order REFUNDED) -
 * Phase 6 never needed this since Order status was previously only ever
 * payment-driven (createOrder/verifyPayment/the webhook). Called from
 * src/features/operations/actions/operation-actions.ts's
 * changeOperationStatus for ORDER-type items.
 */
export async function updateOrderStatusAdmin(orderId: string, status: OrderStatus): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    // Not routed through emitOrderEvent - that stub's OrderEventType covers
    // the payment lifecycle (created/paid/failed) specifically, and an
    // Operations-driven change (e.g. REFUNDED) isn't one of those events.
    // The Operations ActivityLog (see operation-actions.ts's
    // changeOperationStatus) is this change's real record.
    await prisma.order.update({ where: { id: orderId }, data: { status } });
    revalidatePath("/student/orders");
    revalidatePath("/client/orders");
    return { success: true };
  } catch (error) {
    console.error("updateOrderStatusAdmin failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
