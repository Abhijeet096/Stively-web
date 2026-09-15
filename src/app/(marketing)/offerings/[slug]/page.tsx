import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { headers } from "next/headers";

import {
  getOfferings,
  getOfferingBySlug,
  getRelatedOfferings,
  getAllOfferingSlugs,
  getOfferingCurriculumOutline,
} from "@/features/offerings/server/queries";
import { CourseDetailView } from "@/features/offerings/components/course-detail-view";
import { parseOfferingFilters } from "@/features/offerings/validation/offering-filters";
import { slugToCategory } from "@/features/offerings/lib/category-slug";
import { CATEGORY_LABEL } from "@/features/offerings/lib/labels";
import { OfferingCatalog } from "@/features/offerings/components/offering-catalog";
import { OfferingHero } from "@/features/offerings/components/offering-hero";
import { OfferingOverview } from "@/features/offerings/components/offering-overview";
import { OfferingListSection } from "@/features/offerings/components/offering-list-section";
import { OfferingPricingCard } from "@/features/offerings/components/offering-pricing-card";
import { OfferingTestimonialsPlaceholder } from "@/features/offerings/components/offering-testimonials-placeholder";
import { RelatedOfferings } from "@/features/offerings/components/related-offerings";
import { parseOfferingFaqs } from "@/features/offerings/lib/faq";
import { getPrimaryOfferingCtaAction } from "@/features/offerings/lib/purchase-cta";
import { getOfferingPayablePrice } from "@/features/offerings/lib/pricing";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { Section } from "@/components/shared/section";
import { HeroSection } from "@/components/sections/hero-section";
import { FAQSection } from "@/components/sections/faq-section";
import { CTASection } from "@/components/sections/cta-section";

// Maps a catalog category to its dedicated SEO/conversion landing page, once
// one exists (see /website-development) - the landing page is the canonical
// entry point for that service's search intent; this catalog view stays the
// pricing/browse listing and links up to it rather than the two competing
// for the same keyword. Add one entry per category as its page ships.
const CATEGORY_SERVICE_PAGE: Partial<Record<string, string>> = {
  WEBSITE_DEVELOPMENT: "/website-development",
};

interface OfferingSlugPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

/**
 * Only offering slugs are statically generated - category archive pages
 * stay dynamic (they're a filtered listing, same reasoning /training's
 * listing page never gets generateStaticParams either). A category-slug
 * request just falls through to on-demand rendering, since dynamicParams
 * defaults to true.
 */
export async function generateStaticParams() {
  const slugs = await getAllOfferingSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: OfferingSlugPageProps): Promise<Metadata> {
  const { slug } = await params;

  const category = slugToCategory(slug);
  if (category) {
    const label = CATEGORY_LABEL[category];
    return {
      title: label,
      description: `Browse Stively's ${label} offerings.`,
      alternates: { canonical: `/offerings/${slug}` },
    };
  }

  const offering = await getOfferingBySlugForMetadata(slug);
  if (!offering) {
    return { title: "Offering not found" };
  }

  const title = offering.metaTitle ?? offering.title;
  const description = offering.metaDescription ?? offering.shortDescription;

  return {
    title,
    description,
    alternates: { canonical: `/offerings/${offering.slug}` },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/offerings/${offering.slug}`,
      images: [offering.bannerUrl ?? offering.thumbnailUrl ?? "/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      images: [offering.bannerUrl ?? offering.thumbnailUrl ?? "/opengraph-image"],
      title,
      description,
    },
  };
}

/**
 * generateMetadata can't reuse getOfferingBySlug (the real, exported query)
 * without double-incrementing viewCount - metadata generation and the page
 * body both run per-request. A metadata-only lookup skips the write.
 */
async function getOfferingBySlugForMetadata(slug: string) {
  const { prisma } = await import("@/lib/prisma");
  return prisma.offering.findFirst({ where: { slug, status: "PUBLISHED", visible: true } });
}

/**
 * Resolves `/offerings/[slug]` in order: (1) a known category slug renders
 * the catalog pre-filtered to that category - satisfies the brief's
 * "everything comes from slug, don't hardcode routes" for
 * /offerings/training, /offerings/software-development, etc. (2) a real
 * Offering.slug renders the detail page. (3) neither -> notFound().
 */
export default async function OfferingSlugPage({ params, searchParams }: OfferingSlugPageProps) {
  const { slug } = await params;

  const category = slugToCategory(slug);
  if (category) {
    const rawParams = await searchParams;
    const filters = parseOfferingFilters(rawParams);
    const { offerings, totalCount, totalPages, page } = await getOfferings({ ...filters, category });

    const hasActiveFilters = !!(
      filters.q ||
      filters.audience ||
      filters.difficulty ||
      filters.mode ||
      filters.price
    );

    const label = CATEGORY_LABEL[category];
    const servicePage = CATEGORY_SERVICE_PAGE[category];

    return (
      <>
        <HeroSection
          eyebrow="Offerings"
          heading={label}
          subheading={`Browse everything Stively offers under ${label}.`}
          primaryCta={{ label: "Talk to us", href: "/contact" }}
          secondaryCta={servicePage ? { label: `See the full ${label} service`, href: servicePage } : undefined}
        />
        <Section background="default">
          <OfferingCatalog
            offerings={offerings}
            totalCount={totalCount}
            totalPages={totalPages}
            page={page}
            searchParams={rawParams}
            basePath={`/offerings/${slug}`}
            hasActiveFilters={hasActiveFilters}
            activeCategory={category}
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

  const offering = await getOfferingBySlug(slug);
  if (!offering) {
    notFound();
  }

  // A DIGITAL_PRODUCT's real, purpose-built detail page lives at
  // /digital-store/[slug] (see that route) - this generic template renders
  // a thin duplicate of it (whatYoullLearn/benefits/requirements are empty
  // for every digital product), and both pages self-claimed canonical,
  // which is exactly the kind of duplicate-content signal that keeps a page
  // out of Google's index. A permanent redirect consolidates the two into
  // one real, indexable URL instead of leaving it to a canonical tag Google
  // is free to override.
  if (offering.category === "DIGITAL_PRODUCT") {
    permanentRedirect(`/digital-store/${offering.slug}`);
  }

  const nonce = (await headers()).get("x-nonce") ?? undefined;

  // A course sells on a different page than a service does - one focused
  // decision page with the price and enrol action always reachable, instead
  // of the generic hero + list-section stack every other category uses.
  // Same route and canonical URL either way, so this is a layout branch,
  // not a second competing page for the same offering.
  //
  // Checked before computing related/faqs/primaryCta below - CourseDetailView
  // parses its own FAQs and never renders RelatedOfferings or the generic CTA,
  // so this branch used to pay for a full extra getRelatedOfferings() round
  // trip on every request and then throw the result away unused. For a
  // Instagram-traffic landing page, one fewer sequential DB query directly
  // off the critical path to first byte is worth the real TTFB it saves.
  if (offering.category === "TRAINING") {
    const curriculum = await getOfferingCurriculumOutline(offering.id);
    return (
      <>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Course",
            name: offering.title,
            description: offering.shortDescription,
            provider: { "@type": "Organization", name: siteConfig.name, sameAs: siteConfig.url },
            ...(offering.price != null
              ? {
                  offers: {
                    "@type": "Offer",
                    price: ((getOfferingPayablePrice(offering) ?? offering.price) / 100).toString(),
                    priceCurrency: offering.currency,
                  },
                }
              : {}),
          }}
        />
        <CourseDetailView offering={offering} curriculum={curriculum} nonce={nonce} />
      </>
    );
  }

  const related = await getRelatedOfferings(offering);
  const faqs = parseOfferingFaqs(offering.faqs);
  const primaryCta = getPrimaryOfferingCtaAction(offering);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: offering.title,
          description: offering.shortDescription,
          category: CATEGORY_LABEL[offering.category],
          brand: { "@type": "Organization", name: siteConfig.name, sameAs: siteConfig.url },
          ...(offering.price != null
            ? {
                offers: {
                  "@type": "Offer",
                  price: (offering.price / 100).toString(),
                  priceCurrency: offering.currency,
                },
              }
            : {}),
        }}
      />

      <OfferingHero offering={offering} />
      <OfferingOverview offering={offering} />
      <OfferingListSection title="What you'll learn" items={offering.whatYoullLearn} background="muted" />
      <OfferingListSection title="Benefits" items={offering.benefits} background="default" />
      <OfferingListSection title="Who it's for" items={offering.whoItsFor} background="muted" />
      <OfferingListSection title="Requirements" items={offering.requirements} background="default" />
      <OfferingPricingCard offering={offering} nonce={nonce} />
      {faqs.length > 0 && <FAQSection items={faqs} />}
      <OfferingTestimonialsPlaceholder />
      <RelatedOfferings offerings={related} />

      {primaryCta && (
        <CTASection
          heading="Ready to get started?"
          description={
            primaryCta.kind === "buy"
              ? `Get started with ${offering.title} today.`
              : `Reach out about ${offering.title} and we'll take it from there.`
          }
          actionLabel={primaryCta.label}
          actionHref={primaryCta.href}
          inverted
        />
      )}
    </>
  );
}
