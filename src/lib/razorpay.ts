import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Lazily constructed, not a module-level singleton - the Razorpay SDK's
 * constructor throws synchronously ("key_id or oauthToken is mandatory")
 * when key_id is empty, which would crash on import alone, before any
 * offering even needs Razorpay (e.g. a FREE + DIRECT_PAYMENT checkout,
 * which never calls createRazorpayOrder at all). Deferring construction to
 * first real use means the app runs fine with no keys configured yet - the
 * documented state until real keys are added to .env.local - and only the
 * actual attempt to create a paid order fails (caught by its caller).
 */
let client: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ?? "",
      key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
    });
  }
  return client;
}

/**
 * Creates a Razorpay order for a direct-purchase checkout
 * (src/features/orders/actions/order-actions.ts's createOrder). Amount is
 * always in paise - never pass rupees here.
 */
export async function createRazorpayOrder(params: {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  return getRazorpayClient().orders.create({
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
