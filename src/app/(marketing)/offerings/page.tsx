import type { Metadata } from "next";

import { getOfferings } from "@/features/offerings/server/queries";
import { parseOfferingFilters } from "@/features/offerings/validation/offering-filters";
import { OfferingCatalog } from "@/features/offerings/components/offering-catalog";
import { Section } from "@/components/shared/section";
import { HeroSection } from "@/components/sections/hero-section";
import { CTASection } from "@/components/sections/cta-section";

interface OfferingsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Offerings",
    description:
      "Everything Stively offers, in one place - training, internships, software development, AI solutions, and more. Filter by audience, difficulty, mode, and price.",
    // Every filter/search/page combination canonicalizes back to the bare
    // URL - same rule /training follows against thin, near-duplicate pages.
    alternates: { canonical: "/offerings" },
  };
}

/** Reading `searchParams` makes this dynamically rendered - a filtered, paginated catalog can't be meaningfully pre-rendered per URL combination. */
export default async function OfferingsPage({ searchParams }: OfferingsPageProps) {
  const params = await searchParams;
  const filters = parseOfferingFilters(params);

  const { offerings, totalCount, totalPages, page } = await getOfferings(filters);

  const hasActiveFilters = !!(
    filters.q ||
    filters.audience ||
    filters.difficulty ||
    filters.mode ||
    filters.price
  );

  return (
    <>
      <HeroSection
        eyebrow="Offerings"
        heading="Everything Stively offers, in one place"
        subheading="Training, internships, software development, AI solutions, and more - filter by what fits you, not what fits us."
        primaryCta={{ label: "Talk to us", href: "/contact" }}
      />

      <Section background="default">
        <OfferingCatalog
          offerings={offerings}
          totalCount={totalCount}
          totalPages={totalPages}
          page={page}
          searchParams={params}
          basePath="/offerings"
          hasActiveFilters={hasActiveFilters}
        />
      </Section>

      <CTASection
        heading="Not sure what fits?"
        description="Talk to us and we'll help you find the right offering - no pressure, no obligation."
        actionLabel="Talk to us"
        actionHref="/contact"
        inverted
      />
    </>
  );
}
