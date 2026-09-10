"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/utils";
import "@/lib/razorpay-client-types";
import { createOrder, verifyPayment, markOrderFailed } from "../actions/order-actions";

export interface CheckoutButtonProps {
  offeringId: string;
  offeringTitle: string;
  isFree: boolean;
  priceLabel: string;
  /** Base price in paise - needed alongside priceLabel to compute a running total when the prompts-pack add-on is toggled. Undefined for FREE offerings. */
  basePrice?: number;
  currency: string;
  /** Same one-fixed-optional-add-on offer as the guest-checkout flow (GuestCheckoutForm) - null means this offering doesn't have one. */
  promptsPackPrice: number | null;
  userName?: string;
  userEmail?: string;
  /** /student/orders or /client/orders - where the confirmation page lives. */
  detailPathPrefix: string;
  /** CSP nonce from src/proxy.ts, read via `headers()` on the checkout page. */
  nonce?: string;
}

/**
 * The one client island on the checkout page - loads Razorpay's checkout.js
 * lazily (next/script, same pattern as src/components/analytics/analytics.tsx),
 * calls createOrder on click, and either redirects immediately (the FREE
 * short-circuit) or opens the Razorpay modal and verifies the payment
 * server-side before redirecting.
 */
function CheckoutButton({
  offeringId,
  offeringTitle,
  isFree,
  priceLabel,
  basePrice,
  currency,
  promptsPackPrice,
  userName,
  userEmail,
  detailPathPrefix,
  nonce,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = React.useState(false);
  const [phone, setPhone] = React.useState("");
  const [promptsPack, setPromptsPack] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const total = basePrice != null ? basePrice + (promptsPack && promptsPackPrice ? promptsPackPrice : 0) : undefined;
  const payLabel = isFree ? "Get access" : total != null ? `Pay ${formatPrice(total, currency)}` : `Pay ${priceLabel}`;

  async function handleClick() {
    setIsPending(true);
    setError(undefined);

    const result = await createOrder(offeringId, phone.trim() || undefined, promptsPack);

    if (!result.success) {
      setIsPending(false);
      setError(result.error);
      return;
    }

    if (result.alreadyPaid) {
      router.push(`${detailPathPrefix}/${result.orderId}`);
      return;
    }

    if (!scriptReady || typeof window.Razorpay !== "function") {
      setIsPending(false);
      setError("Payment couldn't load - please refresh and try again.");
      return;
    }

    const razorpay = new window.Razorpay({
      key: result.keyId,
      amount: result.amount,
      currency: result.currency,
      order_id: result.razorpayOrderId,
      name: "Stively",
      description: offeringTitle,
      prefill: { name: userName, email: userEmail, contact: phone.trim() || undefined },
      theme: { color: "#4f46e5" },
      handler: async (response) => {
        const verifyResult = await verifyPayment(
          result.orderId,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
        setIsPending(false);
        if (!verifyResult.success) {
          setError(verifyResult.error);
          return;
        }
        router.push(`${detailPathPrefix}/${result.orderId}`);
      },
      modal: {
        ondismiss: () => {
          setIsPending(false);
        },
      },
    });

    razorpay.on("payment.failed", async () => {
      setIsPending(false);
      setError("Payment didn't go through - please try again.");
      await markOrderFailed(result.orderId);
    });

    razorpay.open();
  }

  return (
    <div className="flex flex-col gap-4">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        nonce={nonce}
        onLoad={() => setScriptReady(true)}
      />

      {!isFree && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="checkout-phone">Phone number (optional)</Label>
          <Input
            id="checkout-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="For payment receipts and support"
          />
        </div>
      )}

      {!isFree && promptsPackPrice != null && (
        <div className="border-primary/30 bg-primary/5 flex items-start gap-2.5 rounded-lg border p-3">
          <Checkbox id="checkout-prompts-pack" checked={promptsPack} onCheckedChange={(v) => setPromptsPack(v === true)} className="mt-0.5" />
          <Label htmlFor="checkout-prompts-pack" className="flex-1 cursor-pointer font-normal">
            <span className="text-foreground font-medium">Add 100+ ready-to-use prompt templates</span>
            <span className="text-muted-foreground block text-sm">One-time add-on, {formatPrice(promptsPackPrice, currency)}</span>
          </Label>
        </div>
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button size="lg" loading={isPending} onClick={handleClick} className="w-full">
        {payLabel}
      </Button>
    </div>
  );
}

export { CheckoutButton };
