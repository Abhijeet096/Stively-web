import type { Metadata } from "next";
import Link from "next/link";
import { FolderGit2, ShieldCheck, Building2, Clock, Users2 } from "lucide-react";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Badge } from "@/components/ui/badge";
import { HeroSection } from "@/components/sections/hero-section";
import { WhyWeExist } from "@/components/sections/why-we-exist";
import { MissionVision } from "@/components/sections/mission-vision";
import { HowItWorks } from "@/components/sections/how-it-works";
import { WhyChooseStively, type Reason } from "@/components/sections/why-choose-stively";
import { CTASection } from "@/components/sections/cta-section";

export const metadata: Metadata = {
  title: "About",
  description:
    "Stively is a B2B software and web application development company. See how we work, who's behind the code, and why businesses trust us to build.",
  alternates: { canonical: "/about" },
  // "images" explicit here - see the note in src/app/(marketing)/page.tsx's
  // metadata for why (a page-level openGraph/twitter block replaces the
  // parent's instead of merging, dropping the opengraph-image.tsx image).
  openGraph: {
    title: "About Stively",
    description:
      "Stively is a B2B software and web application development company. See how we work, who's behind the code, and why businesses trust us to build.",
    url: `${siteConfig.url}/about`,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Stively",
    description:
      "Stively is a B2B software and web application development company. See how we work, who's behind the code, and why businesses trust us to build.",
    images: ["/opengraph-image"],
  },
};

/**
 * This is the business engagement timeline specifically (not a generic
 * "how Stively works" for every audience) - the process a business goes
 * through with us. Training's own path is a separate section below
 * (AD-022) rather than folded into this timeline, since the two journeys
 * are genuinely different processes, not one shared flow with two labels.
 */
const BUSINESS_JOURNEY = [
  {
    title: "Requirement",
    description: "Understanding what you actually need before proposing anything.",
  },
  { title: "Project", description: "Scoped, planned, and estimated before development starts." },
  {
    title: "Senior-led Development",
    description: "Built by a trained team, with an experienced lead directing the work.",
  },
  {
    title: "Quality Delivery",
    description: "Reviewed and signed off before it reaches you, not after.",
  },
  {
    title: "Long-term Partnership",
    description: "Support continues after launch - not a one-and-done handoff.",
  },
] as const;

const DIFFERENTIATORS: Reason[] = [
  {
    icon: Building2,
    title: "A software company, not a marketplace",
    description: "One accountable team on your project end to end - not a rotating cast of freelancers.",
  },
  {
    icon: ShieldCheck,
    title: "Senior sign-off before delivery",
    description: "Every piece of work is reviewed and approved before it reaches you, not after.",
  },
  {
    icon: FolderGit2,
    title: "A transparent process",
    description: "You see what's being built and when, not a black box that resurfaces at the deadline.",
  },
  {
    icon: Users2,
    title: "A trained, evaluated team",
    description: "Everyone who touches your project has already proven they can do the work.",
  },
  {
    icon: Clock,
    title: "Delivery without agency overhead",
    description: "Serious engineering discipline, without the price tag or the layers of account managers.",
  },
];

const CORE_VALUES = [
  "Craftsmanship",
  "Transparency",
  "Quality",
  "Accountability",
  "Long-term relationships",
] as const;

/**
 * No Prisma queries on this page - entirely static content, same pattern
 * as Services and Contact. No loading.tsx needed for the same reason.
 * Every section is a Server Component; nothing on this page needs client
 * interactivity, unlike Contact's form or Program Detail's accordion.
 */
export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "About", item: `${siteConfig.url}/about` },
          ],
        }}
      />

      <HeroSection
        eyebrow="About Stively"
        heading="A software company built to be trusted with your project"
        subheading="Stively is a B2B web and application development company. Every project is built by a trained, evaluated team and reviewed by a senior lead before it ever reaches you."
        primaryCta={{ label: "Start a project", href: "/start-project" }}
        secondaryCta={{ label: "Explore services", href: "/services" }}
      />

      <WhyWeExist />
      <MissionVision />

      <HowItWorks
        id="business-journey"
        heading="How we work with you"
        steps={[...BUSINESS_JOURNEY]}
      />

      <WhyChooseStively heading="Why we're different" reasons={DIFFERENTIATORS} />

      <Section background="muted">
        <Container className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Eyebrow>What we stand for</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
              Core values
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CORE_VALUES.map((value) => (
              <Badge key={value} variant="secondary" className="px-3 py-1 text-sm">
                {value}
              </Badge>
            ))}
          </div>
        </Container>
      </Section>

      {/* AD-022: About told only the business story after AD-013's B2B-only
          rewrite dropped the training journey entirely. This restores
          training's visibility here without re-blending it into
          BUSINESS_JOURNEY/DIFFERENTIATORS above (which stay genuinely
          business-specific) - a distinct, modest section, same economy of
          scope as the homepage's own training entry point. */}
      <Section background="default">
        <Container className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
          <Eyebrow>The other side of Stively</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            We also teach the skills behind the work
          </h2>
          <p className="text-muted-foreground text-lg text-pretty">
            The same practical, project-based approach we bring to client work runs through
            Stively&apos;s training programs too - real courses in software development and AI, for
            students and professionals who want to build, not just study.{" "}
            <Link
              href="/training"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Explore training
            </Link>
          </p>
        </Container>
      </Section>

      <CTASection
        heading="Have a project in mind?"
        description="Tell us what you're building - we'll tell you exactly how we'd approach it."
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
