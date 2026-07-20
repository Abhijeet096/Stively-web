import type { Metadata } from "next";
import { GraduationCap, Eye, Code2, ShieldCheck } from "lucide-react";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { HeroSection } from "@/components/sections/hero-section";
import { ServicesGrid } from "@/components/sections/services-grid";
import { IndustriesGrid } from "@/components/sections/industries-grid";
import { TechStack } from "@/components/sections/tech-stack";
import { HowItWorks } from "@/components/sections/how-it-works";
import { WhyChooseStively, type Reason } from "@/components/sections/why-choose-stively";
import { FAQSection, type FAQItem } from "@/components/sections/faq-section";
import { CTASection } from "@/components/sections/cta-section";

const TITLE = "Software Development Services";
const DESCRIPTION =
  "Custom software, web, and AI development from Stively - backed by a talent pipeline trained on real projects, not a freelancer roster.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  // "images" explicit here - see the note in src/app/(marketing)/page.tsx's
  // metadata for why (a page-level openGraph/twitter block replaces the
  // parent's instead of merging, dropping the opengraph-image.tsx image).
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${siteConfig.url}/services`,
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
 * Condensed from the Project Lifecycle documented in
 * docs/core/stively-core-blueprint-v1.md §8 (Requirement -> Estimate ->
 * Proposal -> Approval -> Planning -> Development -> QA -> Deployment ->
 * Support) into 4 steps to fit HowItWorks' existing 4-column layout,
 * rather than building a new component for a 9-step version.
 */
const PROCESS_STEPS = [
  {
    title: "Discovery",
    description: "Requirements, scope, and an estimate - before anything is promised.",
  },
  {
    title: "Planning & Development",
    description: "A clear plan, then building against it in visible stages.",
  },
  { title: "QA & Deployment", description: "Tested and shipped, not just built and handed over." },
  {
    title: "Ongoing Support",
    description: "Software needs upkeep after launch - we stay involved.",
  },
] as const;

const WHY_CHOOSE_REASONS: Reason[] = [
  {
    icon: GraduationCap,
    title: "A trained talent pipeline, not a freelancer roster",
    description:
      "Everyone working on a project has been trained and evaluated inside Stively's own programs first.",
  },
  {
    icon: Eye,
    title: "A transparent process",
    description: "You see the plan, the timeline, and the people working on it - no black box.",
  },
  {
    icon: Code2,
    title: "A modern, maintainable stack",
    description:
      "Built the way we'd want to inherit it - typed, documented, and not held together by hacks.",
  },
  {
    icon: ShieldCheck,
    title: "Built on trust, not hype",
    description: "We'd rather under-promise on a smaller project than over-promise on a big one.",
  },
];

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How does pricing work?",
    answer:
      "Every project is scoped and estimated individually after a discovery conversation - we don't publish a fixed rate card because the work itself varies too much.",
  },
  {
    question: "How long does a typical project take?",
    answer:
      "It depends entirely on scope. You'll get a concrete timeline as part of the proposal, before any work starts.",
  },
  {
    question: "Do you sign NDAs?",
    answer: "Yes - happy to sign one before discussing any specifics of your project.",
  },
  {
    question: "What if our requirements change mid-project?",
    answer:
      "Requirements shifting is normal. We plan in stages specifically so a change in one stage doesn't require re-doing the whole project.",
  },
  {
    question: "Do you offer support after launch?",
    answer: "Yes - ongoing support is part of the process, not a separate afterthought.",
  },
];

/**
 * No Prisma queries on this page - it's entirely static content, so no
 * loading.tsx or query-layer error handling is needed (same precedent as
 * the About page's treatment in docs/phase-e-visual-ux-planning.md).
 */
export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            {
              "@type": "ListItem",
              position: 2,
              name: "Services",
              item: `${siteConfig.url}/services`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />

      <HeroSection
        eyebrow="Software Development"
        heading="Software built by developers who never stop learning"
        subheading="Stively pairs businesses with developers trained on real projects - not a freelancer marketplace, a talent pipeline with a process behind it."
        primaryCta={{ label: "Book a consultation", href: "/contact" }}
        secondaryCta={{ label: "Our process", href: "#how-it-works" }}
      />

      <ServicesGrid />
      <IndustriesGrid />
      <TechStack />
      <HowItWorks heading="How we deliver" steps={[...PROCESS_STEPS]} />
      <WhyChooseStively reasons={WHY_CHOOSE_REASONS} />
      <FAQSection items={FAQ_ITEMS} />

      <CTASection
        heading="Have a project in mind?"
        description="A short call to talk through scope, timeline, and whether this is a fit - no obligation."
        actionLabel="Book a consultation"
        actionHref="/contact"
        inverted
      />
    </>
  );
}
