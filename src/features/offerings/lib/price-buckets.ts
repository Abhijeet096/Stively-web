/**
 * Bucketed price filter, same pattern as src/lib/queries/programs.ts's
 * DURATION_BUCKETS/durationBucketToRange - a handful of human-meaningful
 * ranges rather than a raw min/max slider, since browsing offerings by
 * "roughly how much" is more useful here than exact figures (many
 * offerings have no fixed price at all - see PRICE_BUCKETS' "custom" entry).
 */
export const PRICE_BUCKETS = [
  "free",
  "under-10k",
  "10k-50k",
  "50k-plus",
  "custom",
] as const;

export type PriceBucket = (typeof PRICE_BUCKETS)[number];

export function isValidPriceBucket(value: string | undefined): value is PriceBucket {
  return !!value && (PRICE_BUCKETS as readonly string[]).includes(value);
}

export const PRICE_BUCKET_LABEL: Record<PriceBucket, string> = {
  free: "Free",
  "under-10k": "Under ₹10,000",
  "10k-50k": "₹10,000 - ₹50,000",
  "50k-plus": "₹50,000+",
  custom: "Custom quote",
};

/** Paise-denominated range, or a pricingType match for the non-numeric buckets. */
export function priceBucketToFilter(
  bucket: PriceBucket
): { pricingType: "FREE" | "CUSTOM_QUOTE" } | { price: { gte?: number; lt?: number } } {
  switch (bucket) {
    case "free":
      return { pricingType: "FREE" };
    case "custom":
      return { pricingType: "CUSTOM_QUOTE" };
    case "under-10k":
      return { price: { lt: 1_000_000 } };
    case "10k-50k":
      return { price: { gte: 1_000_000, lt: 5_000_000 } };
    case "50k-plus":
      return { price: { gte: 5_000_000 } };
  }
}
