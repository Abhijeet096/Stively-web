"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { isNextRedirectError } from "@/lib/next-redirect";
import { createRazorpayOrder, verifyRazorpaySignature, describeRazorpayError } from "@/lib/razorpay";
import type { ActionResult } from "@/actions/leads";
import type { AuthActionResult } from "@/actions/auth";
import { createGuestOrderSchema, verifyGuestPaymentSchema, acceptOrderAutoLoginSchema } from "../validation/guest-checkout-schemas";
import { fulfillGuestOrder } from "../server/guest-fulfillment";

export type CreateGuestOrderResult =
  | {
      success: true;
      orderId: string;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }
  | { success: false; error: string };

/**
 * The guest-checkout twin of createOrder (order-actions.ts) - no session,
 * no existing account, name/email/phone captured right here on the
 * checkout form. Only ever usable on an Offering that opted into this
 * (allowsGuestCheckout) - the normal authenticated flow is untouched and
 * still the default for everything else.
 */
export async function createGuestOrder(input: unknown): Promise<CreateGuestOrderResult> {
  const parsed = createGuestOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const offering = await prisma.offering.findFirst({
    where: { id: data.offeringId, status: "PUBLISHED", visible: true, allowsGuestCheckout: true },
  });
  if (!offering) return { success: false, error: "This offering is no longer available." };
  if (offering.purchaseFlow !== "DIRECT_PAYMENT" && offering.purchaseFlow !== "BOTH") {
    return { success: false, error: "This offering isn't available for direct purchase." };
  }
  if (offering.pricingType !== "FIXED" || offering.price == null) {
    return { success: false, error: "This offering doesn't support guest checkout." };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
    // See createOrder's identical comment - same two-causes-one-message problem.
    console.error("createGuestOrder: RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are not set in this environment.");
    return { success: false, error: "Payments aren't set up yet - please contact us directly." };
  }

  const basePrice = offering.discountPrice ?? offering.price;
  const wantsPromptsPack = data.promptsPack && offering.promptsPackPrice != null;
  const amount = basePrice + (wantsPromptsPack ? offering.promptsPackPrice! : 0);

  try {
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: amount,
      receipt: `gst_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`,
      notes: { offeringId: offering.id, guestEmail: data.email },
    });

    const order = await prisma.order.create({
      data: {
        offeringId: offering.id,
        guestName: data.name,
        guestEmail: data.email,
        phone: data.phone,
        amount,
        currency: offering.currency,
        status: "PENDING",
        razorpayOrderId: razorpayOrder.id,
        addons: wantsPromptsPack ? { promptsPack: { purchased: true, price: offering.promptsPackPrice } } : undefined,
      },
    });

    return { success: true, orderId: order.id, razorpayOrderId: razorpayOrder.id, amount, currency: offering.currency, keyId };
  } catch (error) {
    console.error("createGuestOrder (Razorpay) failed:", describeRazorpayError(error));
    return { success: false, error: "Payments aren't set up yet - please contact us directly." };
  }
}

export type VerifyGuestPaymentResult = ActionResult & { autoLoginLink?: string };

/**
 * The guest-checkout twin of verifyPayment - no session to scope the order
 * lookup by (there's no one signed in yet), so the order's own id plus a
 * verified Razorpay signature is the whole trust boundary, same model as
 * every other public payment-adjacent action in this codebase. Real
 * fulfillment (account creation, enrollment, email) lives in
 * fulfillGuestOrder, shared with the webhook's own PAID branch.
 */
export async function verifyGuestPayment(input: unknown): Promise<VerifyGuestPaymentResult> {
  const parsed = verifyGuestPaymentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { orderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !order.razorpayOrderId) return { success: false, error: "Order not found." };
  if (order.status !== "PENDING") return { success: false, error: "This order has already been processed." };

  const isValid = verifyRazorpaySignature({ orderId: order.razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature });
  if (!isValid) {
    // Same reasoning as verifyPayment - don't mark FAILED off a possibly
    // spoofed client call, only a real webhook/payment.failed event does that.
    return { success: false, error: "Payment verification failed." };
  }

  try {
    await prisma.order.update({ where: { id: orderId }, data: { razorpayPaymentId, razorpaySignature } });
    const result = await fulfillGuestOrder(orderId);
    if (!result) return { success: false, error: "Something went wrong finishing your enrollment. We'll follow up by email." };
    return { success: true, autoLoginLink: result.autoLoginLink ?? undefined };
  } catch (error) {
    console.error("verifyGuestPayment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * The public /orders/auto-login page's submit handler - no token
 * validation happens here beyond shape, the real check (lookup, expiry,
 * one-time consumption) lives in src/lib/auth.ts's Credentials authorize(),
 * same as every other token-authenticated action in this codebase trusting
 * the token's own unguessability as the credential.
 */
export async function acceptOrderAutoLogin(_prevState: AuthActionResult | null, formData: FormData): Promise<AuthActionResult> {
  const parsed = acceptOrderAutoLoginSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) return { success: false, error: "This link isn't valid." };

  try {
    // Straight into My Learning, not the generic dashboard - someone who
    // just paid for a course wants the course, and one extra click to find
    // it is exactly the friction this whole flow exists to remove.
    await signIn("credentials", { token: parsed.data.token, redirectTo: "/student/learning" });
    return { success: true };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error("acceptOrderAutoLogin failed:", error);
    return { success: false, error: "This link isn't valid or has expired. Try signing in, or use \"Forgot password\" with the email you used to purchase." };
  }
}
