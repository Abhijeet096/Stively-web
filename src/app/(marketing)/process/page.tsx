import type { Metadata } from "next";
import { MessageCircle, Eye, FileCheck } from "lucide-react";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { HeroSection } from "@/components/sections/hero-section";
import { ProcessTimeline, type ProcessStep } from "@/components/sections/process-timeline";
import { WhyChooseStively, type Reason } from "@/components/sections/why-choose-stively";
import { CTASection } from "@/components/sections/cta-section";

const TITLE = "Our Process";
const DESCRIPTION =
  "What actually happens after you contact Stively - from the first call to a live, supported product, in nine defined stages.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/process" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${siteConfig.url}/process`,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: TITLE,
    description: DESCRIPTION,
  },
};

const STEPS: ProcessStep[] = [
  {
    title: "Discovery call",
    description:
      "A short, no-pressure conversation about what you're trying to build and why - so we understand the real problem before proposing a solution.",
  },
  {
    title: "Requirement analysis",
    description:
      "We turn that conversation into a concrete list of what the product needs to do, who it's for, and what success looks like - the document everything else gets scoped against.",
  },
  {
    title: "Proposal & quote",
    description:
      "A written proposal covering scope, timeline, milestones, and a fixed price - so you know exactly what you're agreeing to before anything is booked.",
  },
  {
    title: "Advance payment",
    description:
      "Once you approve the proposal, an advance payment confirms the engagement and reserves the team's time to start work.",
  },
  {
    title: "Design",
    description:
      "Real screens built around your actual content and brand, not a generic template - reviewed and revised with you before development starts.",
  },
  {
    title: "Development",
    description:
      "Built in visible stages on a staging environment you can check in on throughout, not a black box until the big reveal.",
  },
  {
    title: "Testing",
    description:
      "Checked against real devices, browsers, and edge cases - and against performance and accessibility standards - before anything reaches your users.",
  },
  {
    title: "Deployment",
    description:
      "Launched onto hosting and a domain you control, with a clean handover of source code and access - nothing held back once the project is paid.",
  },
  {
    title: "Support",
    description:
      "A defined post-launch window to fix anything that comes up once real users start clicking around - software needs upkeep, not a one-time handoff.",
  },
];

const WHY_THIS_ORDER: Reason[] = [
  {
    icon: FileCheck,
    title: "Scope and price are fixed before work starts",
    description: "You approve a written proposal before a line of code is written - not after.",
  },
  {
    icon: Eye,
    title: "You see progress the whole way through",
    description: "A staging link and regular check-ins during development, not silence until launch.",
  },
  {
    icon: MessageCircle,
    title: "Every stage has a clear exit",
    description: "You always know what's been delivered, what's next, and who to talk to about it.",
  },
];

/**
 * Not a legal page - the CEO's own framing: this answers "what happens
 * after I contact you," which is one of the first questions a prospective
 * client actually has. Reuses ProcessTimeline (see process-timeline.tsx)
 * with its own 9-step sequence rather than the abbreviated 5/7-step
 * versions already shown on the homepage and /website-development - this
 * is meant to be the detailed, definitive version those pages tease.
 */
export default function ProcessPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Our Process", item: `${siteConfig.url}/process` },
          ],
        }}
      />

      <HeroSection
        eyebrow="Our process"
        heading="What happens after you contact us"
        subheading="Nine defined stages, the same way for every project - so you always know what's happening and what comes next."
        primaryCta={{ label: "Start a project", href: "/start-project" }}
        secondaryCta={{ label: "See our pricing", href: "/pricing" }}
      />

      <ProcessTimeline
        eyebrow="Start to finish"
        heading="From first call to live product"
        description="Every engagement runs through these nine stages, in this order - nothing skipped, nothing assumed."
        steps={STEPS}
      />

      <WhyChooseStively heading="Why we work this way" reasons={WHY_THIS_ORDER} />

      <CTASection
        heading="Ready to start with a discovery call?"
        description="No obligation - just a conversation about what you're trying to build."
        actionLabel="Start a project"
        actionHref="/start-project"
        inverted
        glow
      />
    </>
  );
}
