import type { OfferingCategory } from "@prisma/client";

/**
 * Explicit, hand-written map rather than an auto-derived kebab-case of the
 * enum value - the URL is a public contract (SEO, bookmarks, the sitemap)
 * and shouldn't silently change if an enum value is ever renamed for
 * internal reasons. `/offerings/[slug]` resolves against this map before
 * falling back to an individual Offering.slug lookup - see
 * src/app/(marketing)/offerings/[slug]/page.tsx.
 */
export const CATEGORY_SLUG: Record<OfferingCategory, string> = {
  TRAINING: "training",
  INTERNSHIP: "internship",
  SOFTWARE_DEVELOPMENT: "software-development",
  WEBSITE_DEVELOPMENT: "website-development",
  MOBILE_DEVELOPMENT: "mobile-development",
  AI_SOLUTIONS: "ai-solutions",
  DIGITAL_MARKETING: "digital-marketing",
  CAREER_GUIDANCE: "career-guidance",
  CORPORATE_TRAINING: "corporate-training",
  SAAS: "saas",
  DIGITAL_PRODUCT: "digital-store",
};

const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_SLUG).map(([category, slug]) => [slug, category as OfferingCategory])
) as Record<string, OfferingCategory>;

export function categoryToSlug(category: OfferingCategory): string {
  return CATEGORY_SLUG[category];
}

export function slugToCategory(slug: string): OfferingCategory | undefined {
  return SLUG_TO_CATEGORY[slug];
}

export function isValidCategory(value: string | undefined): value is OfferingCategory {
  return !!value && value in CATEGORY_SLUG;
}
