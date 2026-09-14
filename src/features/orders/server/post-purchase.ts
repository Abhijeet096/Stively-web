import "server-only";

import { prisma } from "@/lib/prisma";
import { createOperationItemForOrder } from "@/features/operations/server/creation";
import { createEnrollmentFromOrder } from "@/features/enrollments/server/creation";
import { notifyOrderPaid } from "./notify";
import { sendPostPurchaseWhatsApp } from "@/features/whatsapp/server/post-purchase-whatsapp";

/**
 * The single place every PAID transition routes through -
 * createOrder's FREE short-circuit, verifyPayment, the Razorpay webhook, and
 * fulfillGuestOrder (guest-fulfillment.ts) all call this instead of
 * duplicating the operation-item/enrollment/notify triplet inline. Fixes two
 * real bugs the architecture audit found: guest checkout sending two "you
 * paid" emails (notifyOrderPaid's generic one plus guest-fulfillment's own
 * richer welcome/download email), and the webhook's non-guest branch racing
 * a concurrent verifyPayment call with no shared claim between them.
 *
 * Idempotency is enforced here, not by the callers: `postPurchaseProcessedAt`
 * is claimed atomically (updateMany where it's still null - the same
 * "conditional update as a claim" idiom ensureDownloadUnlocked already uses
 * for Order.downloadToken), so calling this twice - or four times, from four
 * different call sites racing each other - runs the side effects exactly
 * once. Callers never need their own guard; they just call this once they
 * know the order is PAID, however they got there.
 *
 * Takes an orderId, not an Order row - always re-fetches fresh rather than
 * trusting a caller's possibly-stale copy, since this is frequently called
 * from more than one place for the same order in the same few hundred
 * milliseconds.
 */
export async function handleOrderPaid(orderId: string): Promise<void> {
  const claim = await prisma.order.updateMany({
    where: { id: orderId, postPurchaseProcessedAt: null },
    data: { postPurchaseProcessedAt: new Date() },
  });
  if (claim.count === 0) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { offering: { select: { category: true } } },
  });
  if (!order) return;

  try {
    await createOperationItemForOrder(order);
  } catch (error) {
    console.error("handleOrderPaid: createOperationItemForOrder failed:", error);
  }

  // A DIGITAL_PRODUCT order has no curriculum to enroll into - same
  // exclusion guest-fulfillment.ts's own inline call already applied before
  // this existed. The authenticated checkout path never actually reaches a
  // DIGITAL_PRODUCT order today (that category is guest-checkout-only - see
  // digital-store/[slug]/page.tsx), so this changes no observed behavior
  // there; it's here so the rule lives in one place instead of being
  // re-decided per caller.
  if (order.offering.category !== "DIGITAL_PRODUCT") {
    try {
      await createEnrollmentFromOrder(order);
    } catch (error) {
      console.error("handleOrderPaid: createEnrollmentFromOrder failed:", error);
    }
  }

  try {
    // guestEmail is set at creation for every guest-checkout order and never
    // cleared afterward (even once userId is backfilled) - the one reliable
    // signal that guest-fulfillment.ts already sent (or is about to send)
    // this buyer its own richer confirmation email, so the generic one here
    // should skip email and just leave the in-app Notification.
    await notifyOrderPaid(order, { sendEmail: order.guestEmail == null });
  } catch (error) {
    console.error("handleOrderPaid: notifyOrderPaid failed:", error);
  }

  // WhatsApp failures must never affect payment success or any of the above
  // - independently try/caught, same as every other side effect here, and
  // sendPostPurchaseWhatsApp has its own further idempotency guard
  // (Order.whatsappConfirmationSentAt) on top of this function's own claim.
  try {
    await sendPostPurchaseWhatsApp(order);
  } catch (error) {
    console.error("handleOrderPaid: sendPostPurchaseWhatsApp failed:", error);
  }
}
