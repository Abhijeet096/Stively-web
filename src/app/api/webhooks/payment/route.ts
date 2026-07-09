import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";

/**
 * Razorpay webhook receiver. Configure this URL (`/api/webhooks/payment`)
 * in the Razorpay dashboard once live keys exist. Kept as a route handler
 * (not a server action) because Razorpay's servers, not our frontend, call
 * this directly over HTTP - webhooks always need a real endpoint.
 *
 * Not wired to a live enrollment flow yet since there's no checkout UI to
 * trigger it (that's Step 5+). The verification + status-update logic is
 * ready so wiring it up later is a small change, not new architecture.
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

    await prisma.enrollment.updateMany({
      where: { paymentRef: orderId },
      data: { status: "PAID" },
    });
  }

  return NextResponse.json({ received: true });
}
