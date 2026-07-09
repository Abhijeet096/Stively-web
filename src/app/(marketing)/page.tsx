import type { Metadata } from "next";

import { getFeaturedPrograms } from "../../lib/queries/programs";
import { getFeaturedTestimonials } from "@/lib/queries/testimonials";
import { HeroSection } from "@/components/sections/hero-section";
import { ProgramsOverview } from "@/components/sections/programs-overview";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Testimonials } from "@/components/sections/testimonials";
import { CTASection } from "@/components/sections/cta-section";
import { WhoWeHelp } from "@/components/sections/who-we-help";

export const metadata: Metadata = {
  title: "Stively - Real Industry Experience for Students",
  description:
    "Practical training programs that lead to real projects and internships. Stively trains developers, connects them with real work, and helps companies hire the ones who are ready.",
};

const HOW_IT_WORKS_STEPS = [
  {
    title: "Enroll",
    description: "Pick a program that matches where you are and where you want to go.",
  },
  {
    title: "Learn",
    description: "Structured, cohort-based training - not a self-paced video library.",
  },
  {
    title: "Build",
    description: "Ship real projects, not toy exercises, with mentor feedback along the way.",
  },
  {
    title: "Get certified",
    description: "Walk away with a certificate and a portfolio you can actually show.",
  },
] as const;

/**
 * Section order and every inclusion/omission decision here follows
 * docs/phase-e-visual-ux-planning.md's Home wireframe exactly:
 * - Trust Band is intentionally not rendered - Phase E's own rule is to cut
 *   it entirely when there are no real numbers to show yet, rather than
 *   ship a placeholder.
 * - Programs Overview and Testimonials are omitted (not shown with an
 *   EmptyState) when their data is empty - an empty section on a marketing
 *   page reads as broken, not "coming soon."
 * - Who We Help stays after the CTA band, never before it - see Phase E's
 *   Home revision for the full reasoning.
 */
export default async function HomePage() {
  const [programs, testimonials] = await Promise.all([
    getFeaturedPrograms(),
    getFeaturedTestimonials(),
  ]);

  return (
    <>
      <HeroSection
        eyebrow="For students who want the real thing"
        heading="Learn by building what companies actually need"
        subheading="Stively trains developers, connects them with real projects, and helps companies hire the ones who are ready."
        primaryCta={{ label: "Explore Programs", href: "/training" }}
        secondaryCta={{ label: "How it works", href: "#how-it-works" }}
      />

      {programs.length > 0 && <ProgramsOverview programs={programs} />}

      <HowItWorks steps={[...HOW_IT_WORKS_STEPS]} />

      {testimonials.length > 0 && <Testimonials testimonials={testimonials} />}

      <CTASection
        heading="Ready to start?"
        description="Enroll in a program and start building toward something real."
        actionLabel="Explore Programs"
        actionHref="/training"
        inverted
      />

      <WhoWeHelp />
    </>
  );
}
