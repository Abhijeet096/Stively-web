import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { HeroSection } from "@/components/sections/hero-section";
import { PricingTiers } from "@/components/sections/pricing-tiers";
import { PRICING_TIERS } from "@/lib/pricing";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { CTASection } from "@/components/sections/cta-section";

const TITLE = "Pricing";
const DESCRIPTION =
  "Three fixed starting points for websites, business platforms, and full custom software - scoped further once we understand your project.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  // "images" explicit here - see the note in src/app/(marketing)/page.tsx's
  // metadata for why (a page-level openGraph/twitter block replaces the
  // parent's instead of merging, dropping the opengraph-image.tsx image).
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${siteConfig.url}/pricing`,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: TITLE,
    description: DESCRIPTION,
  },
};

/**
 * No Prisma queries - static content, same precedent as About/Services
 * (see docs/phase-e-visual-ux-planning.md), so no loading.tsx is needed.
 */
export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Pricing", item: `${siteConfig.url}/pricing` },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Stively Software Development",
          offers: PRICING_TIERS.map((tier) => ({
            "@type": "Offer",
            name: tier.name,
            price: (tier.priceInPaise / 100).toFixed(0),
            priceCurrency: "INR",
            description: tier.description,
          })),
        }}
      />

      <HeroSection
        eyebrow="Pricing"
        heading="Three starting points, no pricing surprises"
        subheading="Every project is scoped individually once we understand what you need - these are the fixed points most engagements start from."
        primaryCta={{ label: "Start a project", href: "/contact?type=business" }}
        secondaryCta={{ label: "See how we work", href: "/#how-we-work" }}
      />

      <PricingTiers variant="full" />

      <Section background="muted">
        <Container size="narrow" className="flex flex-col gap-3 text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            Every plan can flex
          </h2>
          <p className="text-muted-foreground text-pretty">
            Enterprise Solution lists AI features &quot;if required&quot; because not every project
            needs them - and the same applies across every tier. Tell us what you&apos;re building
            and we&apos;ll scope it against one of these, or something in between.
          </p>
        </Container>
      </Section>

      <CTASection
        heading="Not sure which tier fits?"
        description="A short call to talk through scope and get a straight answer - no obligation."
        actionLabel="Start a project"
        actionHref="/contact?type=business"
        inverted
        glow
      />
    </>
  );
}
