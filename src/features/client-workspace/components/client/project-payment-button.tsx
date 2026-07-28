"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import "@/lib/razorpay-client-types";
import { createProjectPaymentOrder, verifyProjectPayment, markProjectPaymentFailed } from "../../actions/payment-actions";

export interface ProjectPaymentButtonProps {
  paymentId: string;
  label: string;
  userName?: string;
  userEmail?: string;
  nonce?: string;
}

/** The client-facing "Pay Now" for one SalesProjectPayment installment - mirrors CheckoutButton (src/features/orders/components/checkout-button.tsx) exactly, targeting a project installment instead of a catalog Offering. */
function ProjectPaymentButton({ paymentId, label, userName, userEmail, nonce }: ProjectPaymentButtonProps) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleClick() {
    setIsPending(true);
    setError(undefined);

    const result = await createProjectPaymentOrder(paymentId);
    if (!result.success) {
      setIsPending(false);
      setError(result.error);
      return;
    }
    if (result.alreadyPaid) {
      setIsPending(false);
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
      currency: "INR",
      order_id: result.razorpayOrderId,
      name: "Stively",
      description: label,
      prefill: { name: userName, email: userEmail },
      theme: { color: "#2e3a46" },
      handler: async (response) => {
        const verifyResult = await verifyProjectPayment(paymentId, response.razorpay_payment_id, response.razorpay_signature);
        setIsPending(false);
        if (!verifyResult.success) {
          setError(verifyResult.error);
          return;
        }
        router.refresh();
      },
      modal: { ondismiss: () => setIsPending(false) },
    });

    razorpay.on("payment.failed", async () => {
      setIsPending(false);
      setError("Payment didn't go through - please try again.");
      await markProjectPaymentFailed(paymentId);
    });

    razorpay.open();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" nonce={nonce} onLoad={() => setScriptReady(true)} />
      <Button type="button" size="sm" loading={isPending} onClick={handleClick}>
        Pay Now
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export { ProjectPaymentButton };
