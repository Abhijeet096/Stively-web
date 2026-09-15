"use server";

import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/lib/auth";
import { isNextRedirectError } from "@/lib/next-redirect";
import { createRazorpayOrder, verifyRazorpaySignature, describeRazorpayError } from "@/lib/razorpay";
import type { ActionResult } from "@/actions/leads";
import type { AuthActionResult } from "@/actions/auth";
import { createGuestOrderSchema, verifyGuestPaymentSchema, acceptOrderAutoLoginSchema } from "../validation/guest-checkout-schemas";
import { fulfillGuestOrder } from "../server/guest-fulfillment";
import { getOfferingPayablePrice } from "@/features/offerings/lib/pricing";

export type CreateGuestOrderResult =
  | {
      success: true;
      orderId: string;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }
  | { success: false; error: string }
  | {
      success: false;
      alreadyOwned: true;
      error: string;
      /** Set only when the person filling out the form is already signed in as the account that owns this - send them straight there instead of making them log in again. */
      redirectUrl?: string;
    };

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

  // Someone re-buying a course/product they already paid for and own - most
  // often a returning customer who forgot they'd already purchased, or one
  // who typed the email they bought under. Catch it before Razorpay even
  // opens rather than let them pay twice and sort it out afterwards.
  const existingOrder = await prisma.order.findFirst({
    where: {
      offeringId: offering.id,
      status: "PAID",
      OR: [{ guestEmail: { equals: data.email, mode: "insensitive" } }, { user: { email: { equals: data.email, mode: "insensitive" } } }],
    },
    select: { id: true, userId: true, downloadToken: true },
  });
  if (existingOrder) {
    const session = await auth();
    const isSignedInAsOwner = existingOrder.userId != null && session?.user?.id === existingOrder.userId;
    return {
      success: false,
      alreadyOwned: true,
      error: isSignedInAsOwner
        ? "You already own this - here's your account."
        : `You already own this. Please log in with ${data.email} to get access.`,
      redirectUrl: isSignedInAsOwner ? (existingOrder.downloadToken ? `/student/orders/${existingOrder.id}` : "/student/learning") : undefined,
    };
  }

  const basePrice = getOfferingPayablePrice(offering) ?? offering.price!;
  // Either/or, 500 wins if a tampered request somehow sent both - see
  // Offering.promptsPack500Price's own comment on why this is a single
  // choice, not two stackable add-ons.
  const addonChoice: "promptsPack500" | "promptsPack" | null =
    data.promptsPack500 && offering.promptsPack500Price != null
      ? "promptsPack500"
      : data.promptsPack && offering.promptsPackPrice != null
        ? "promptsPack"
        : null;
  const addonPrice =
    addonChoice === "promptsPack500"
      ? offering.promptsPack500Price!
      : addonChoice === "promptsPack"
        ? offering.promptsPackPrice!
        : 0;
  const amount = basePrice + addonPrice;

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
        addons:
          addonChoice === "promptsPack500"
            ? { promptsPack500: { purchased: true, price: offering.promptsPack500Price } }
            : addonChoice === "promptsPack"
              ? { promptsPack: { purchased: true, price: offering.promptsPackPrice } }
              : undefined,
      },
    });

    return { success: true, orderId: order.id, razorpayOrderId: razorpayOrder.id, amount, currency: offering.currency, keyId };
  } catch (error) {
    console.error("createGuestOrder (Razorpay) failed:", describeRazorpayError(error));
    return { success: false, error: "Payments aren't set up yet - please contact us directly." };
  }
}

export type VerifyGuestPaymentResult = ActionResult & { autoLoginLink?: string; downloadUrl?: string };

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

  // The Razorpay webhook (/api/webhooks/payment) and this client-side call
  // both confirm the same payment independently, and the webhook can win
  // the race - it often arrives before the browser's own handler callback
  // even fires. That's a second confirmation of success, not an error:
  // fulfillGuestOrder is race-safe and idempotent (see its own comment), so
  // ask it for the already-computed result instead of re-verifying a
  // signature that's already been checked once and telling a paying
  // customer their own successful payment "has already been processed."
  if (order.status === "PAID") {
    const result = await waitForGuestOrderFulfillment(orderId);
    if (!result) return { success: false, error: "Something went wrong finishing your order. We'll follow up by email." };
    return { success: true, autoLoginLink: result.autoLoginLink ?? undefined, downloadUrl: result.downloadUrl ?? undefined };
  }
  if (order.status !== "PENDING") {
    return { success: false, error: "This order has already been processed." };
  }

  const isValid = verifyRazorpaySignature({ orderId: order.razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature });
  if (!isValid) {
    // Same reasoning as verifyPayment - don't mark FAILED off a possibly
    // spoofed client call, only a real webhook/payment.failed event does that.
    return { success: false, error: "Payment verification failed." };
  }

  try {
    await prisma.order.update({ where: { id: orderId }, data: { razorpayPaymentId, razorpaySignature } });
    const result = await fulfillGuestOrder(orderId);
    if (!result) return { success: false, error: "Something went wrong finishing your order. We'll follow up by email." };
    return { success: true, autoLoginLink: result.autoLoginLink ?? undefined, downloadUrl: result.downloadUrl ?? undefined };
  } catch (error) {
    console.error("verifyGuestPayment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Only reached when the webhook already flipped this order to PAID.
 * fulfillGuestOrder's own atomic claim means calling it here just reports
 * the webhook's result rather than redoing the work - but the webhook's own
 * call may still be mid-flight (status flips to PAID before its account
 * creation / token generation finishes), so a single immediate call can
 * briefly see a real order with no tokens on it yet. A short, bounded
 * retry covers that window without ever blocking a genuinely broken order.
 */
async function waitForGuestOrderFulfillment(orderId: string, attempts = 5, delayMs = 400) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const result = await fulfillGuestOrder(orderId);
    if (result?.autoLoginLink || result?.downloadUrl) return result;
    if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return await fulfillGuestOrder(orderId);
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

  // Read-only lookup by the same token authorize() will consume below -
  // doesn't touch the token itself, just decides where this particular
  // order should land once signed in. A pure course order still goes
  // straight into My Learning (one extra click to find the course is
  // exactly the friction this flow exists to remove); an order that
  // unlocked a real file (a digital product, or a course bought with the
  // eBook add-on) goes to My Purchases instead, where that file's
  // download button actually lives - landing on the (empty, for a
  // standalone digital product) LMS would be a dead end.
  const order = await prisma.order.findUnique({ where: { autoLoginToken: parsed.data.token }, select: { id: true, downloadToken: true } });
  const redirectTo = order?.downloadToken ? `/student/orders/${order.id}` : "/student/learning";

  try {
    await signIn("credentials", { token: parsed.data.token, redirectTo });
    return { success: true };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error("acceptOrderAutoLogin failed:", error);
    return { success: false, error: "This link isn't valid or has expired. Try signing in, or use \"Forgot password\" with the email you used to purchase." };
  }
}
