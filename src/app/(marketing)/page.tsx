import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { getFeaturedTestimonials } from "@/lib/queries/testimonials";
import { getFeaturedPortfolioItems } from "@/lib/queries/portfolio";
import { HeroSection } from "@/components/sections/hero-section";
import { HeroVisual } from "@/components/sections/hero-visual";
import { TrustStrip } from "@/components/sections/trust-strip";
import { WhyStivelyComparison } from "@/components/sections/why-stively-comparison";
import { CapabilitiesStrip } from "@/components/sections/capabilities-strip";
import { PortfolioShowcase } from "@/components/sections/portfolio-showcase";
import { PricingTiers } from "@/components/sections/pricing-tiers";
import { BusinessProcess } from "@/components/sections/business-process";
import { Testimonials } from "@/components/sections/testimonials";
import { AudiencePaths } from "@/components/sections/audience-paths";
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
 * Dual-audience homepage (AD-022, superseding the prior "business-first,
 * training demoted" rebuild this comment used to describe). Stively serves
 * two real audiences - businesses buying software, and learners buying
 * training - and the new brand identity ("Build. Learn. Grow.") commits to
 * both being visible from the first screen, not one buried under the other.
 * Narrative: both audiences acknowledged in the hero -> why trust us (still
 * business-detailed, that content stays) -> what we build -> proof (if any
 * exists) -> AudiencePaths gives training a real, equal-weight entry point
 * instead of a footnote -> pricing/process/testimonials (business, unchanged)
 * -> closing ask, now routing both audiences instead of only one.
 *
 * Still no fabricated stats or client logos anywhere below - AGENTS.md's
 * standing rule - but PortfolioShowcase is the first real exception to
 * "no case studies yet": actual shipped demo sites, shown only once real
 * PortfolioItem rows exist (same conditional-render-when-empty discipline
 * Testimonials already used below). Trust is still built through process
 * transparency first; this section adds concrete proof on top, not instead.
 */
export default async function HomePage() {
  const [testimonials, portfolioItems] = await Promise.all([
    getFeaturedTestimonials(),
    getFeaturedPortfolioItems(),
  ]);

  return (
    <>
      <HeroSection
        eyebrow="Build. Learn. Grow."
        eyebrowMono
        heading={
          <>
            Build custom software with developers{" "}
            <span className="from-primary to-brand-teal-text bg-linear-to-r bg-clip-text text-transparent">
              you can trust
            </span>{" "}
            - or become one.
          </>
        }
        subheading="Stively builds custom software for businesses with developers trained on real projects - and runs the same practical programs for students and professionals who want to build real software themselves."
        primaryCta={{ label: "Start a project", href: "/start-project" }}
        secondaryCta={{ label: "Explore training", href: "/training" }}
        visual={<HeroVisual />}
      />

      <TrustStrip />
      <WhyStivelyComparison />
      <CapabilitiesStrip />

      {portfolioItems.length > 0 && <PortfolioShowcase items={portfolioItems} />}

      <PricingTiers variant="teaser" />
      <BusinessProcess />

      {testimonials.length > 0 && <Testimonials testimonials={testimonials} />}

      <AudiencePaths />

      <CTASection
        heading="Ready to build, or ready to learn?"
        description="Start a project if you're building something real - or explore training if you want to build it yourself."
        actionLabel="Start a project"
        actionHref="/start-project"
        secondaryActionLabel="Explore training"
        secondaryActionHref="/training"
        inverted
        glow
      />
    </>
  );
}
