"use client";

import * as React from "react";
import Script from "next/script";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import "@/lib/razorpay-client-types";
import { createGuestOrder, verifyGuestPayment } from "../actions/guest-checkout-actions";

export interface GuestCheckoutFormProps {
  offering: {
    id: string;
    title: string;
    price: number;
    currency: string;
    promptsPackPrice: number | null;
  };
  /** CSP nonce from src/proxy.ts, read via `headers()` on the offering page. */
  nonce?: string;
  /** "Enroll Now" reads right for a course, wrong for a one-off product - the call site names its own verb. Defaults to the original course wording so every existing caller is unaffected. */
  ctaLabel?: string;
  namePlaceholder?: string;
  /** Overrides the promptsPack add-on's label/description - lets a course page point the bonus at the real, purchasable Digital Store product instead of the original unlinked promise. Ignored when the offering has no promptsPackPrice. */
  promptsPackCopy?: { label: string; description: string };
}

/**
 * The zero-login checkout path for an Offering with allowsGuestCheckout on
 * - name/email/phone captured right here, no account exists until payment
 * actually succeeds (see fulfillGuestOrder). Deliberately minimal: no
 * multi-step wizard, one form, one button, matching the "cold Instagram
 * traffic, ready-to-buy audience, zero distraction" brief this was built
 * for.
 */
function GuestCheckoutForm({
  offering,
  nonce,
  ctaLabel = "Enroll Now for",
  namePlaceholder = "For your certificate",
  promptsPackCopy,
}: GuestCheckoutFormProps) {
  const [scriptReady, setScriptReady] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [promptsPack, setPromptsPack] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [alreadyOwned, setAlreadyOwned] = React.useState<{ message: string; redirectUrl?: string } | undefined>();

  const total = offering.price + (promptsPack && offering.promptsPackPrice ? offering.promptsPackPrice : 0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);

    const result = await createGuestOrder({ offeringId: offering.id, name, email, phone, promptsPack });
    if (!result.success) {
      setIsPending(false);
      if ("alreadyOwned" in result && result.alreadyOwned) {
        setAlreadyOwned({ message: result.error, redirectUrl: result.redirectUrl });
        return;
      }
      setError(result.error);
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
      description: offering.title,
      prefill: { name, email, contact: phone },
      theme: { color: "#ec3013" },
      handler: async (response) => {
        const verifyResult = await verifyGuestPayment({
          orderId: result.orderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        setIsPending(false);
        if (!verifyResult.success) {
          setError(verifyResult.error);
          return;
        }
        // Straight into the account, signed in - no separate "click here to
        // continue" step. autoLoginLink now resolves to the right place for
        // what was actually bought (My Purchases with a real download
        // button for a digital product, My Learning for a course) - see
        // acceptOrderAutoLogin. downloadUrl is the fallback only if
        // fulfillment somehow produced a file but no account link.
        window.location.href = verifyResult.autoLoginLink ?? verifyResult.downloadUrl ?? "/login";
      },
      modal: { ondismiss: () => setIsPending(false) },
    });

    razorpay.on("payment.failed", () => {
      setIsPending(false);
      setError("Payment didn't go through - please try again.");
    });

    razorpay.open();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" nonce={nonce} onLoad={() => setScriptReady(true)} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gc-name">Full name</Label>
        <Input id="gc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={namePlaceholder} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gc-email">Email</Label>
        <Input id="gc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="For your account" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gc-phone">Phone number</Label>
        <Input id="gc-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="For order updates" required />
      </div>

      {offering.promptsPackPrice != null && (
        <div className="border-primary/30 bg-primary/5 flex items-start gap-2.5 rounded-lg border p-3">
          <Checkbox id="gc-prompts-pack" checked={promptsPack} onCheckedChange={(v) => setPromptsPack(v === true)} className="mt-0.5" />
          <Label htmlFor="gc-prompts-pack" className="flex-1 cursor-pointer font-normal">
            <span className="text-foreground font-medium">
              {promptsPackCopy?.label ?? "Add 100+ ready-to-use prompt templates"}
            </span>
            <span className="text-muted-foreground block text-sm">
              {promptsPackCopy?.description ?? "One-time add-on"}, {formatPrice(offering.promptsPackPrice, offering.currency)}
            </span>
          </Label>
        </div>
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        {ctaLabel} {formatPrice(total, offering.currency)}
      </Button>

      <Dialog open={!!alreadyOwned} onOpenChange={(open) => !open && setAlreadyOwned(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You already have this</DialogTitle>
            <DialogDescription>{alreadyOwned?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {alreadyOwned?.redirectUrl ? (
              <Button asChild>
                <Link href={alreadyOwned.redirectUrl}>Go to my account</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/login">Log in</Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

export { GuestCheckoutForm };
