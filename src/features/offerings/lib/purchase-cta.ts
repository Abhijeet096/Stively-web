import type { Offering } from "@prisma/client";
import type { ButtonProps } from "@/components/ui/button";

export interface OfferingCtaAction {
  kind: "buy" | "guidance";
  label: string;
  href: string;
}

/**
 * One source of truth for which CTA(s) an offering shows (Phase 6) -
 * consumed by both OfferingCTA (multi-button, hero/pricing card) and the
 * detail page's closing CTASection (single action), so the
 * purchaseFlow/audience branching only lives here.
 *
 * DIRECT_PAYMENT -> just "Buy now". CONSULTATION -> today's audience-based
 * Enroll/Request Proposal, unchanged wording. BOTH -> "Buy now" first, then
 * a guidance action per audience - relabeled "Talk to an advisor" for
 * Student (matches the brief's mockup) since "Enroll now" would be
 * confusing sitting next to a Buy button; Business keeps "Request
 * proposal" either way.
 */
export function getOfferingCtaActions(offering: Offering): OfferingCtaAction[] {
  const actions: OfferingCtaAction[] = [];
  const showBuy = offering.purchaseFlow === "DIRECT_PAYMENT" || offering.purchaseFlow === "BOTH";
  const showGuidance = offering.purchaseFlow === "CONSULTATION" || offering.purchaseFlow === "BOTH";

  if (showBuy) {
    // A guest-checkout offering's real checkout is the embedded form on
    // this same page (OfferingPricingCard), not the login-gated /checkout
    // route - point at it directly rather than sending someone through a
    // page that would just force a sign-in first, defeating the entire
    // point of this flow.
    const href = offering.allowsGuestCheckout ? "#enroll" : `/checkout/${offering.slug}`;
    // "Enroll now" for a course, "Buy now" for everything else - buying a
    // training program is enrolling in it, and that word tested as the
    // clearer intent for the student audience. Not applied to
    // SOFTWARE_DEVELOPMENT/WEBSITE_DEVELOPMENT etc, where "enroll" would be
    // meaningless for what's actually being purchased.
    const label = offering.category === "TRAINING" ? "Enroll now" : "Buy now";
    actions.push({ kind: "buy", label, href });
  }

  if (showGuidance) {
    if (offering.audience === "STUDENT" || offering.audience === "BOTH") {
      actions.push({
        kind: "guidance",
        label: showBuy ? "Talk to an advisor" : "Enroll now",
        href: `/enroll/${offering.slug}`,
      });
    }
    if (offering.audience === "BUSINESS" || offering.audience === "BOTH") {
      actions.push({ kind: "guidance", label: "Request proposal", href: `/request-proposal/${offering.slug}` });
    }
  }

  return actions;
}

/** The single action a one-button surface (the detail page's closing CTASection) should show - "buy" wins when both are available, since that's the higher-intent path. */
export function getPrimaryOfferingCtaAction(offering: Offering): OfferingCtaAction | undefined {
  return getOfferingCtaActions(offering)[0];
}

export const OFFERING_CTA_PRIMARY_VARIANT: NonNullable<ButtonProps["variant"]> = "primary";
export const OFFERING_CTA_SECONDARY_VARIANT: NonNullable<ButtonProps["variant"]> = "outline";
