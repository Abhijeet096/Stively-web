import type {
  OfferingAudience,
  OfferingCategory,
  OfferingStatus,
  PricingType,
  Difficulty,
  Mode,
} from "@prisma/client";

export const CATEGORY_LABEL: Record<OfferingCategory, string> = {
  TRAINING: "Training",
  INTERNSHIP: "Internship",
  SOFTWARE_DEVELOPMENT: "Software Development",
  WEBSITE_DEVELOPMENT: "Website Development",
  MOBILE_DEVELOPMENT: "Mobile Development",
  AI_SOLUTIONS: "AI Solutions",
  DIGITAL_MARKETING: "Digital Marketing",
  CAREER_GUIDANCE: "Career Guidance",
  CORPORATE_TRAINING: "Corporate Training",
  SAAS: "SaaS",
  DIGITAL_PRODUCT: "Digital Product",
};

export const AUDIENCE_LABEL: Record<OfferingAudience, string> = {
  STUDENT: "Student",
  BUSINESS: "Business",
  BOTH: "Student & Business",
};

export const STATUS_LABEL: Record<OfferingStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
  COMING_SOON: "Coming soon",
};

export const PRICING_TYPE_LABEL: Record<PricingType, string> = {
  FREE: "Free",
  FIXED: "Fixed price",
  SUBSCRIPTION: "Subscription",
  CUSTOM_QUOTE: "Custom quote",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const MODE_LABEL: Record<Mode, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  HYBRID: "Hybrid",
};

/**
 * Formats an Offering's price for card/hero display, honoring the pricing
 * type rather than assuming every offering has a fixed number - a Custom
 * Quote or Free offering has `price: null` by design (see
 * prisma/schema.prisma's Offering.price comment).
 */
export function formatOfferingPrice(
  price: number | null,
  currency: string,
  pricingType: PricingType,
  formatPrice: (amountInPaise: number, currency?: string) => string
): string {
  if (pricingType === "FREE") return "Free";
  if (pricingType === "CUSTOM_QUOTE" || price == null) return "Custom quote";
  const formatted = formatPrice(price, currency);
  return pricingType === "SUBSCRIPTION" ? `${formatted}/mo` : formatted;
}
