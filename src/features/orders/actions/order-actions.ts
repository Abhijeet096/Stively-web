"use server";

import { revalidatePath } from "next/cache";

import type { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/session";
import { createRazorpayOrder, verifyRazorpaySignature } from "@/lib/razorpay";
import type { ActionResult } from "@/actions/leads";
import { emitOrderEvent } from "../lib/events";
import { createOperationItemForOrder } from "@/features/operations/server/creation";
import { createEnrollmentFromOrder } from "@/features/enrollments/server/creation";

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
 */
export async function createOrder(offeringId: string, phone?: string): Promise<CreateOrderResult> {
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

      // Non-fatal by design (Phase 7/8) - see submitRequest's identical
      // comment in offering-requests/actions/request-actions.ts.
      try {
        await createOperationItemForOrder(order);
      } catch (error) {
        console.error("createOperationItemForOrder failed:", error);
      }
      try {
        await createEnrollmentFromOrder(order);
      } catch (error) {
        console.error("createEnrollmentFromOrder failed:", error);
      }

      revalidatePath("/student/orders");
      revalidatePath("/client/orders");
      return { success: true, orderId: order.id, alreadyPaid: true };
    } catch (error) {
      console.error("createOrder (free) failed:", error);
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }

  const amount = offering.discountPrice ?? offering.price;
  if (amount == null) {
    return { success: false, error: "This offering doesn't have a price set yet." };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
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
    console.error("createOrder (Razorpay) failed:", error);
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
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID", razorpayPaymentId, razorpaySignature, paidAt: new Date() },
    });
    emitOrderEvent("ORDER_PAID", updated);

    try {
      await createOperationItemForOrder(updated);
    } catch (error) {
      console.error("createOperationItemForOrder failed:", error);
    }
    try {
      await createEnrollmentFromOrder(updated);
    } catch (error) {
      console.error("createEnrollmentFromOrder failed:", error);
    }

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
