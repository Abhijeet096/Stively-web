import type { Metadata } from "next";
import { FolderGit2, Users, GraduationCap, Building2, ShieldCheck } from "lucide-react";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { HeroSection } from "@/components/sections/hero-section";
import { WhyWeExist } from "@/components/sections/why-we-exist";
import { MissionVision } from "@/components/sections/mission-vision";
import { HowItWorks } from "@/components/sections/how-it-works";
import { WhyChooseStively, type Reason } from "@/components/sections/why-choose-stively";
import { WhoWeServe } from "@/components/sections/who-we-serve";
import { LookingAhead } from "@/components/sections/looking-ahead";
import { ExploreMoreCta } from "@/components/sections/explore-more-cta";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Stively exists, how our ecosystem connects training to real work, and why students and businesses trust us.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Stively",
    description:
      "Why Stively exists, how our ecosystem connects training to real work, and why students and businesses trust us.",
    url: `${siteConfig.url}/about`,
  },
  twitter: {
    card: "summary_large_image",
    title: "About Stively",
    description:
      "Why Stively exists, how our ecosystem connects training to real work, and why students and businesses trust us.",
  },
};

const STUDENT_JOURNEY = [
  { title: "Training", description: "Structured, cohort-based programs - not a video library." },
  { title: "Evaluation", description: "Real assessment of skill, not a completion certificate." },
  { title: "Internship", description: "Applying what was learned on an actual internal project." },
  { title: "Real Client Projects", description: "Working on software a real business will use." },
  {
    title: "Career Growth",
    description: "A portfolio and track record employers can actually verify.",
  },
] as const;

const BUSINESS_JOURNEY = [
  {
    title: "Requirement",
    description: "Understanding what you actually need before proposing anything.",
  },
  { title: "Project", description: "Scoped, planned, and estimated before development starts." },
  {
    title: "Mentor-led Development",
    description: "Built by trained developers, guided by experienced mentors.",
  },
  {
    title: "Quality Delivery",
    description: "Reviewed and tested before it reaches you, not after.",
  },
  {
    title: "Long-term Partnership",
    description: "Support continues after launch - not a one-and-done handoff.",
  },
] as const;

const DIFFERENTIATORS: Reason[] = [
  {
    icon: FolderGit2,
    title: "Real projects, not exercises",
    description: "Students and interns work on software that's actually going to be used.",
  },
  {
    icon: Users,
    title: "Mentor-guided internships",
    description:
      "Every internship has an experienced mentor attached - not self-directed busywork.",
  },
  {
    icon: GraduationCap,
    title: "Practical learning",
    description: "Programs are built around outcomes, not a syllabus for its own sake.",
  },
  {
    icon: Building2,
    title: "Business-first delivery",
    description:
      "Client work is planned and delivered the way a real engagement should be, not as an afterthought to teaching.",
  },
  {
    icon: ShieldCheck,
    title: "Internal quality review",
    description: "Work is reviewed before it reaches a client, not left to chance.",
  },
];

const CORE_VALUES = [
  "Learning by building",
  "Transparency",
  "Quality",
  "Continuous improvement",
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
        heading="Turning learning into real experience - and real experience into hiring"
        subheading="Stively trains students on real projects, and gives businesses access to developers who've already proven themselves on real work."
        primaryCta={{ label: "Explore Training", href: "/training" }}
        secondaryCta={{ label: "Explore Services", href: "/services" }}
      />

      <WhyWeExist />
      <MissionVision />

      <HowItWorks
        id="student-journey"
        heading="How it works - for students"
        steps={[...STUDENT_JOURNEY]}
      />
      <HowItWorks
        id="business-journey"
        heading="How it works - for businesses"
        steps={[...BUSINESS_JOURNEY]}
      />

      <WhyChooseStively heading="Why we're different" reasons={DIFFERENTIATORS} />

      <Section background="muted">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Core values</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {CORE_VALUES.map((value) => (
              <Badge key={value} variant="secondary">
                {value}
              </Badge>
            ))}
          </div>
        </Container>
      </Section>

      <WhoWeServe />
      <LookingAhead />
      <ExploreMoreCta />
    </>
  );
}
