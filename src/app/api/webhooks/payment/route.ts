import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { handleOrderPaid } from "@/features/orders/server/post-purchase";
import { fulfillGuestOrder } from "@/features/orders/server/guest-fulfillment";

/**
 * Razorpay webhook receiver. Configure this URL (`/api/webhooks/payment`)
 * in the Razorpay dashboard once live keys exist. Kept as a route handler
 * (not a server action) because Razorpay's servers, not our frontend, call
 * this directly over HTTP - webhooks always need a real endpoint.
 *
 * Two independent branches: the original Enrollment/Program matching
 * (still unused - Program has no checkout UI) and the Phase 6 Order
 * matching, which IS live now (src/app/checkout/[slug]/) - see that
 * branch's comment for why this is defense-in-depth, not the primary
 * payment-confirmation path.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const orderId: string = event.payload.payment.entity.order_id;
    const paymentId: string = event.payload.payment.entity.id;

    await prisma.enrollment.updateMany({
      where: { paymentRef: orderId },
      data: { status: "PAID" },
    });

    // Defense-in-depth for the Phase 6 Order/checkout flow: the client-side
    // verifyPayment() call (src/features/orders/actions/order-actions.ts)
    // is what normally marks an Order PAID, but this covers the case where
    // a user closes the tab right after paying, before that call completes.
    // Matched by razorpayOrderId, not scoped to status: "PENDING" here (an
    // already-PAID match is a legitimate second delivery, not an error) -
    // the actual PENDING->PAID transition below is what's atomically
    // guarded, not this lookup.
    const matchedOrder = await prisma.order.findFirst({ where: { razorpayOrderId: orderId } });
    if (matchedOrder && !matchedOrder.userId) {
      // Guest-checkout order (Offering.allowsGuestCheckout) - no account
      // exists yet either, so this needs the full fulfillGuestOrder pipeline
      // (account creation, enrollment, auto-login token, welcome email), not
      // just a status flip. Safe if verifyGuestPayment already won this race
      // client-side - fulfillGuestOrder's own atomic claim makes this a
      // no-op in that case.
      try {
        await prisma.order.update({ where: { id: matchedOrder.id }, data: { razorpayPaymentId: paymentId } });
        await fulfillGuestOrder(matchedOrder.id);
      } catch (error) {
        console.error("fulfillGuestOrder (webhook) failed:", error);
      }
    } else if (matchedOrder) {
      // The real race guard: an atomic conditional update (matches
      // verifyPayment's own identical fix in order-actions.ts), not a
      // read-then-unconditional-write - the previous version of this branch
      // read `status: "PENDING"` in the findFirst above and then wrote
      // unconditionally here, which is exactly the non-atomic pattern that
      // let this webhook and a concurrent verifyPayment() call both pass
      // the read and both run the full side-effect triplet.
      await prisma.order.updateMany({
        where: { id: matchedOrder.id, status: "PENDING" },
        data: { status: "PAID", razorpayPaymentId: paymentId, paidAt: new Date() },
      });
      // handleOrderPaid is independently idempotent (its own
      // postPurchaseProcessedAt claim) - safe to call whether or not this
      // specific caller won the PENDING->PAID race above.
      try {
        await handleOrderPaid(matchedOrder.id);
      } catch (error) {
        console.error("handleOrderPaid (webhook) failed:", error);
      }
    }
  }

  if (event.event === "payment.failed") {
    const orderId: string = event.payload.payment.entity.order_id;

    await prisma.order.updateMany({
      where: { razorpayOrderId: orderId, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ received: true });
}
