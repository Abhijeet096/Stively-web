import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? "",
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
});

/**
 * Creates a Razorpay order for a program enrollment. Called from the
 * `initiateEnrollment` server action once the enrollment checkout UI exists
 * (Step 5+). Amount is always in paise - never pass rupees here.
 */
export async function createRazorpayOrder(params: {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  return razorpay.orders.create({
    amount: params.amountInPaise,
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
}

/**
 * Verifies the HMAC signature Razorpay sends on payment webhooks/callbacks.
 * Never trust a "payment succeeded" client-side event without this check -
 * it's the only way to confirm the payment actually came from Razorpay.
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  return expected === params.signature;
}
