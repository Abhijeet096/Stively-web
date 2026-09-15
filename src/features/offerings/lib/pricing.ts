import type { Offering } from "@prisma/client";

type PricedOffering = Pick<Offering, "price" | "discountPrice" | "saleEndsAt" | "saleCycleMinutes">;

/**
 * The next cycle boundary for a recurring sale (see Offering.saleCycleMinutes'
 * own comment) - aligned to the Unix epoch, so it's the exact same instant
 * for every visitor and every request, not something computed relative to
 * when a particular person loaded the page. That's what makes it a real
 * deadline rather than a per-visit fake one: two people looking at this
 * offering at the same moment always see the same remaining time, and it's
 * the same boundary getOfferingPayablePrice checks, so checkout can't
 * disagree with the countdown.
 */
function getNextSaleCycleBoundary(cycleMinutes: number, now: number = Date.now()): Date {
  const cycleMs = cycleMinutes * 60_000;
  return new Date(Math.ceil((now + 1) / cycleMs) * cycleMs);
}

/**
 * True whenever `discountPrice` should currently apply.
 * - `saleCycleMinutes` set: always true (the discount recurs every cycle,
 *   no manual reset needed) - the countdown is to the next cycle boundary,
 *   not to the discount actually ending.
 * - Otherwise, null `saleEndsAt` means the discount has no expiry (every
 *   offering seeded before that field existed keeps behaving exactly as it
 *   did before); once `saleEndsAt` passes, this flips to false everywhere
 *   it's checked - display and the actual Razorpay charge both read from
 *   this, so a one-time deadline genuinely raises the price, not just the
 *   copy on the page.
 */
function isOfferingSaleActive(offering: PricedOffering): boolean {
  if (offering.discountPrice == null) return false;
  if (offering.saleCycleMinutes != null) return true;
  if (offering.saleEndsAt == null) return true;
  return offering.saleEndsAt.getTime() > Date.now();
}

/** What the buyer actually pays right now. */
function getOfferingPayablePrice(offering: PricedOffering): number | null {
  return isOfferingSaleActive(offering) ? offering.discountPrice : offering.price;
}

/** The struck-through reference price, or null when there's nothing to anchor against. */
function getOfferingAnchorPrice(offering: PricedOffering): number | null {
  return isOfferingSaleActive(offering) && offering.price != null ? offering.price : null;
}

function getOfferingPercentOff(offering: PricedOffering): number | null {
  const anchor = getOfferingAnchorPrice(offering);
  const payable = getOfferingPayablePrice(offering);
  if (anchor == null || payable == null || anchor <= 0) return null;
  const pct = Math.round(((anchor - payable) / anchor) * 100);
  return pct > 0 ? pct : null;
}

/** The countdown target to display - a real cycle boundary, a real one-time deadline, or null when there's nothing to count down to. */
function getOfferingCountdownTarget(offering: PricedOffering): Date | null {
  if (!isOfferingSaleActive(offering)) return null;
  if (offering.saleCycleMinutes != null) return getNextSaleCycleBoundary(offering.saleCycleMinutes);
  return offering.saleEndsAt;
}

/** One call for every card/page that needs the full picture. */
function getOfferingPricing(offering: PricedOffering) {
  return {
    payable: getOfferingPayablePrice(offering),
    anchor: getOfferingAnchorPrice(offering),
    percentOff: getOfferingPercentOff(offering),
    saleActive: isOfferingSaleActive(offering),
    saleEndsAt: getOfferingCountdownTarget(offering),
  };
}

export {
  isOfferingSaleActive,
  getOfferingPayablePrice,
  getOfferingAnchorPrice,
  getOfferingPercentOff,
  getOfferingCountdownTarget,
  getOfferingPricing,
};
