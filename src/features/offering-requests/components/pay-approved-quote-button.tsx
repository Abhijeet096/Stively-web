"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrderFromApprovedQuote, verifyPayment, markOrderFailed } from "@/features/orders/actions/order-actions";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void; on: (event: string, handler: (response: unknown) => void) => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

export interface PayApprovedQuoteButtonProps {
  requestId: string;
  offeringTitle: string;
  priceLabel: string;
  userName?: string;
  userEmail?: string;
  /** /student/requests or /client/requests - where this same detail page lives, since paying doesn't navigate away. */
  detailPathPrefix: string;
  /** CSP nonce from src/proxy.ts, read via `headers()` on the request detail page. */
  nonce?: string;
}

/**
 * Pays an admin-approved custom quote - same checkout.js integration as
 * CheckoutButton, pointed at createOrderFromApprovedQuote instead of
 * createOrder. Reloads the current request detail page on success rather
 * than redirecting to an Order page, since the request itself is the
 * durable record the client already has bookmarked.
 */
function PayApprovedQuoteButton({
  requestId,
  offeringTitle,
  priceLabel,
  userName,
  userEmail,
  detailPathPrefix,
  nonce,
}: PayApprovedQuoteButtonProps) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = React.useState(false);
  const [phone, setPhone] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleClick() {
    setIsPending(true);
    setError(undefined);

    const result = await createOrderFromApprovedQuote(requestId, phone.trim() || undefined);

    if (!result.success) {
      setIsPending(false);
      setError(result.error);
      return;
    }

    if (result.alreadyPaid) {
      router.refresh();
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
        router.push(`${detailPathPrefix}/${requestId}`);
        router.refresh();
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="quote-pay-phone">Phone number (optional)</Label>
        <Input
          id="quote-pay-phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="For payment receipts and support"
        />
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button size="lg" loading={isPending} onClick={handleClick} className="w-full">
        Pay {priceLabel}
      </Button>
    </div>
  );
}

export { PayApprovedQuoteButton };
