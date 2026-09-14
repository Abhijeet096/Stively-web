/**
 * Phase 1's deterministic, non-AI product recommendation - a static
 * offeringSlug -> recommendedOfferingSlug map, exactly as the architecture
 * audit specified ("Do NOT invoke AI just to make a simple product
 * recommendation"). Cheaper, instant, fully auditable compared to a Groq
 * call for a decision this simple; save AI-driven recommendation for once
 * there's real conversation signal to reason over (audit's own Phase 3).
 *
 * Keyed and valued by real Offering.slug values (see prisma/seed-genai-course.ts,
 * prisma/seed-digital-store.ts) - never invented slugs.
 */
const RECOMMENDATION_MAP: Record<string, string> = {
  "generative-ai-prompt-engineering": "500-ai-prompt-templates",
};

/** Null when the purchased offering has no configured cross-sell, or when the recommended offering doesn't exist/isn't published (checked by the caller against real Offering rows, not assumed from this map alone). */
export function getRecommendedOfferingSlug(purchasedOfferingSlug: string): string | null {
  return RECOMMENDATION_MAP[purchasedOfferingSlug] ?? null;
}
