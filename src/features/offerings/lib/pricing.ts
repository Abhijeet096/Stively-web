import type { Offering } from "@prisma/client";

type PricedOffering = Pick<Offering, "price" | "discountPrice" | "saleEndsAt">;

/**
 * True whenever `discountPrice` should currently apply. Null `saleEndsAt`
 * means the discount has no expiry (every offering seeded before this field
 * existed keeps behaving exactly as it did before). Once `saleEndsAt`
 * passes, this flips to false everywhere it's checked - display and the
 * actual Razorpay charge both read from this, so the price genuinely goes
 * up, not just the copy on the page.
 */
function isOfferingSaleActive(offering: PricedOffering): boolean {
  if (offering.discountPrice == null) return false;
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

/** One call for every card/page that needs the full picture. */
function getOfferingPricing(offering: PricedOffering) {
  const saleActive = isOfferingSaleActive(offering);
  return {
    payable: getOfferingPayablePrice(offering),
    anchor: getOfferingAnchorPrice(offering),
    percentOff: getOfferingPercentOff(offering),
    saleActive,
    saleEndsAt: saleActive ? offering.saleEndsAt : null,
  };
}

export { isOfferingSaleActive, getOfferingPayablePrice, getOfferingAnchorPrice, getOfferingPercentOff, getOfferingPricing };
