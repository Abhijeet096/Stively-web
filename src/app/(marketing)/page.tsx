import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { getFeaturedTestimonials } from "@/lib/queries/testimonials";
import { HeroSection } from "@/components/sections/hero-section";
import { HeroVisual } from "@/components/sections/hero-visual";
import { TrustStrip } from "@/components/sections/trust-strip";
import { WhyStivelyComparison } from "@/components/sections/why-stively-comparison";
import { CapabilitiesStrip } from "@/components/sections/capabilities-strip";
import { PricingTiers } from "@/components/sections/pricing-tiers";
import { BusinessProcess } from "@/components/sections/business-process";
import { Testimonials } from "@/components/sections/testimonials";
import { EcosystemNote } from "@/components/sections/ecosystem-note";
import { CTASection } from "@/components/sections/cta-section";

const TITLE = "Stively - Software Development for Businesses";
// Kept under ~160 characters so Google and social previews don't truncate
// it mid-sentence - see the same discipline applied site-wide in Phase 5.
const DESCRIPTION =
  "Stively builds custom software with developers trained and evaluated first - not a freelancer roster. Transparent process, fixed estimates, no black box.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  // Explicit "images" below is required, not redundant with opengraph-image.tsx:
  // Next.js only auto-merges the generated image when a route has NO
  // page-level openGraph/twitter block. Once a page defines its own (as this
  // one does, for title/description/url), that object fully replaces the
  // parent's instead of merging field-by-field, silently dropping the image.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: siteConfig.url,
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
 * Business-first homepage rebuild. Previous version led with training
 * (student-first hero, a program-card carousel as the second section,
 * "Who we help" giving training/business/mentors equal billing) - the
 * business is now the primary audience per explicit direction, so the
 * narrative runs: what we build -> why trust us -> what we build (detail)
 * -> how an engagement runs -> proof (if any exists) -> where the talent
 * comes from (training, demoted, not dominant) -> final ask.
 *
 * No fabricated case studies, client logos, or stats anywhere below -
 * none exist yet to show honestly (AGENTS.md's standing rule). Trust is
 * built through process transparency and real, verifiable claims about
 * how Stively operates, not invented outcomes or numbers.
 */
export default async function HomePage() {
  const testimonials = await getFeaturedTestimonials();

  return (
    <>
      <HeroSection
        eyebrow="Software development for businesses"
        eyebrowMono
        heading={
          <>
            Software built by developers who&apos;ve{" "}
            <span className="from-primary to-brand-teal-text bg-linear-to-r bg-clip-text text-transparent">
              already proven themselves
            </span>
          </>
        }
        subheading="Stively pairs your project with developers trained and evaluated inside our own programs first - not a freelancer roster, a talent pipeline with a real process behind it."
        primaryCta={{ label: "Start a project", href: "/contact?type=business" }}
        secondaryCta={{ label: "See how we work", href: "#how-we-work" }}
        visual={<HeroVisual />}
      />

      <TrustStrip />
      <WhyStivelyComparison />
      <CapabilitiesStrip />
      <PricingTiers variant="teaser" />
      <BusinessProcess />

      {testimonials.length > 0 && <Testimonials testimonials={testimonials} />}

      <EcosystemNote />

      <CTASection
        heading="Ready to talk about your project?"
        description="No sales pitch, no pressure - just a straight answer about whether we're the right fit."
        actionLabel="Start a project"
        actionHref="/contact?type=business"
        inverted
        glow
      />
    </>
  );
}
