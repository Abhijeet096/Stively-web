"use client";

import * as React from "react";
import Script from "next/script";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn, formatPrice } from "@/lib/utils";
import "@/lib/razorpay-client-types";
import { trackMetaPurchase } from "@/lib/meta-pixel";
import { createGuestOrder, verifyGuestPayment } from "../actions/guest-checkout-actions";

export interface GuestCheckoutFormProps {
  offering: {
    id: string;
    title: string;
    price: number;
    currency: string;
    promptsPackPrice: number | null;
    /** Second, higher-tier either/or bump alongside promptsPackPrice - see Offering.promptsPack500Price. */
    promptsPack500Price?: number | null;
  };
  /** CSP nonce from src/proxy.ts, read via `headers()` on the offering page. */
  nonce?: string;
  /** "Enroll Now" reads right for a course, wrong for a one-off product - the call site names its own verb. Defaults to the original course wording so every existing caller is unaffected. */
  ctaLabel?: string;
  namePlaceholder?: string;
  /** Overrides the promptsPack add-on's label/description - lets a course page point the bonus at the real, purchasable Digital Store product instead of the original unlinked promise. Ignored when the offering has no promptsPackPrice. */
  promptsPackCopy?: { label: string; description: string };
  /** Same, for the promptsPack500 tier. Ignored when the offering has no promptsPack500Price. */
  promptsPack500Copy?: { label: string; description: string };
}

/**
 * The zero-login checkout path for an Offering with allowsGuestCheckout on
 * - name/email/phone captured right here, no account exists until payment
 * actually succeeds (see fulfillGuestOrder). Deliberately minimal: no
 * multi-step wizard, one form, one button, matching the "cold Instagram
 * traffic, ready-to-buy audience, zero distraction" brief this was built
 * for.
 */
type AddonChoice = "none" | "promptsPack" | "promptsPack500";

function GuestCheckoutForm({
  offering,
  nonce,
  ctaLabel = "Enroll Now for",
  namePlaceholder = "For your certificate",
  promptsPackCopy,
  promptsPack500Copy,
}: GuestCheckoutFormProps) {
  const [scriptReady, setScriptReady] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [addon, setAddon] = React.useState<AddonChoice>("none");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [alreadyOwned, setAlreadyOwned] = React.useState<{ message: string; redirectUrl?: string } | undefined>();
  // Guards against Razorpay's documented "handler can fire more than once"
  // edge case double-reporting the same purchase to the Meta Pixel - see
  // the handler below. A ref, not state: it must survive without
  // triggering a re-render, and only needs to live for this one component
  // instance's lifetime (there's no success page to revisit that could
  // reset it - see trackMetaPurchase's own comment on why that's the real
  // duplicate-prevention boundary here).
  const purchaseTrackedRef = React.useRef(false);

  const addonPrice =
    addon === "promptsPack500"
      ? (offering.promptsPack500Price ?? 0)
      : addon === "promptsPack"
        ? (offering.promptsPackPrice ?? 0)
        : 0;
  const total = offering.price + addonPrice;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);

    const result = await createGuestOrder({
      offeringId: offering.id,
      name,
      email,
      phone,
      promptsPack: addon === "promptsPack",
      promptsPack500: addon === "promptsPack500",
    });
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

        // Meta Pixel Purchase - fired here and only here: after the
        // backend has actually verified the Razorpay signature (or
        // confirmed the webhook already did), never on the Razorpay
        // `handler` callback alone. `amount`/`currency` are the real,
        // verified transaction value from the server response (paise ->
        // rupees), so an order that included a paid prompt-pack add-on
        // reports what was genuinely charged, not a hardcoded course
        // price. The ref guard covers Razorpay's own documented "handler
        // can fire more than once" case within this one checkout session;
        // there's no separate reloadable success page for this flow (see
        // the redirect below) for a stale duplicate to replay from.
        if (!purchaseTrackedRef.current && verifyResult.amount != null && verifyResult.currency) {
          purchaseTrackedRef.current = true;
          trackMetaPurchase(verifyResult.amount / 100, verifyResult.currency);
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

      {(offering.promptsPackPrice != null || offering.promptsPack500Price != null) && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-foreground mb-0.5 text-sm font-medium">Add a prompt pack?</legend>

          <AddonOption
            id="gc-addon-none"
            checked={addon === "none"}
            onSelect={() => setAddon("none")}
            label="No thanks"
            description="Just the course"
          />

          {offering.promptsPackPrice != null && (
            <AddonOption
              id="gc-addon-100"
              checked={addon === "promptsPack"}
              onSelect={() => setAddon("promptsPack")}
              label={promptsPackCopy?.label ?? "100 Practical AI Prompts"}
              description={`${promptsPackCopy?.description ?? "PDF download, delivered by email"} · ${formatPrice(offering.promptsPackPrice, offering.currency)}`}
            />
          )}

          {offering.promptsPack500Price != null && (
            <AddonOption
              id="gc-addon-500"
              checked={addon === "promptsPack500"}
              onSelect={() => setAddon("promptsPack500")}
              label={promptsPack500Copy?.label ?? "500 AI Prompt Templates"}
              description={`${promptsPack500Copy?.description ?? "PDF download, delivered by email"} · ${formatPrice(offering.promptsPack500Price, offering.currency)}`}
              badge={
                offering.promptsPackPrice != null
                  ? `5x the prompts, just ${formatPrice(offering.promptsPack500Price - offering.promptsPackPrice, offering.currency)} more`
                  : "Best value"
              }
            />
          )}
        </fieldset>
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

/**
 * One card in the either/or prompt-pack upsell (native radio under a styled
 * label - accessible, keyboard-operable, no new dependency for what's
 * really a 3-option radio group). The `badge` prop is where the actual
 * upsell psychology lives: an explicit, true, computed comparison ("5x the
 * prompts, just ₹100 more") anchored against the cheaper option right next
 * to it, not invented urgency - see course-detail-view.tsx/AD-025 for why.
 */
function AddonOption({
  id,
  checked,
  onSelect,
  label,
  description,
  badge,
}: {
  id: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  description: string;
  badge?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      )}
    >
      <input
        type="radio"
        id={id}
        name="gc-addon"
        checked={checked}
        onChange={onSelect}
        className="accent-primary mt-0.5 size-4 shrink-0"
      />
      <span className="flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-foreground text-sm font-medium">{label}</span>
          {badge && (
            <Badge variant="success" className="font-normal">
              {badge}
            </Badge>
          )}
        </span>
        <span className="text-muted-foreground block text-sm">{description}</span>
      </span>
    </label>
  );
}

export { GuestCheckoutForm };
