import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { createOperationItemForOrder } from "@/features/operations/server/creation";
import { createEnrollmentFromOrder } from "@/features/enrollments/server/creation";
import { notifyOrderPaid } from "@/features/orders/server/notify";

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
    // The `status: "PENDING"` guard (checked before updating, not just in
    // an updateMany filter) makes this idempotent - a second webhook
    // delivery, or one arriving after verifyPayment already ran, is a
    // no-op rather than double-processing or creating a duplicate
    // OperationItem (OperationItem.orderId is @unique, so a second attempt
    // would fail loudly instead of silently duplicating).
    const pendingOrder = await prisma.order.findFirst({ where: { razorpayOrderId: orderId, status: "PENDING" } });
    if (pendingOrder) {
      const paid = await prisma.order.update({
        where: { id: pendingOrder.id },
        data: { status: "PAID", razorpayPaymentId: paymentId, paidAt: new Date() },
      });
      try {
        await createOperationItemForOrder(paid);
      } catch (error) {
        console.error("createOperationItemForOrder (webhook) failed:", error);
      }
      try {
        await createEnrollmentFromOrder(paid);
      } catch (error) {
        console.error("createEnrollmentFromOrder (webhook) failed:", error);
      }
      try {
        await notifyOrderPaid(paid);
      } catch (error) {
        console.error("notifyOrderPaid (webhook) failed:", error);
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
