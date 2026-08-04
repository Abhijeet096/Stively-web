import type { Metadata } from "next";
import { MessageCircle, Eye, FileCheck } from "lucide-react";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { HeroSection } from "@/components/sections/hero-section";
import { ProcessStageDetailList, type ProcessStageDetail } from "@/components/sections/process-stage-detail";
import { WhyChooseStively, type Reason } from "@/components/sections/why-choose-stively";
import { FAQSection, type FAQItem } from "@/components/sections/faq-section";
import { CTASection } from "@/components/sections/cta-section";

const TITLE = "Our Process - How Stively Takes a Project from Call to Launch";
const DESCRIPTION =
  "Exactly what happens after you contact Stively, stage by stage - typical timelines, what you receive at each step, and what we need from you, from the first call to post-launch support.";

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

/**
 * Durations are typical ranges for a standard project, not a promise for
 * every engagement - a Starter Website (2-3 weeks total, per /website-
 * development's own FAQ) runs toward the faster end of each range; a
 * larger custom build runs toward the slower end. Stated as ranges rather
 * than fixed numbers for exactly that reason.
 */
const STAGES: ProcessStageDetail[] = [
  {
    title: "Discovery call",
    duration: "Same day",
    summary:
      "A short, no-pressure conversation about what you're trying to build and why - so we understand the real problem before proposing a solution.",
    deliverables: [
      "A shared understanding of what you're building and why",
      "Notes from the call, so nothing said gets lost or re-explained later",
    ],
  },
  {
    title: "Requirement analysis",
    duration: "1-2 business days",
    summary:
      "We turn that conversation into a concrete list of what the product needs to do, who it's for, and what success looks like - the document everything else gets scoped against.",
    deliverables: ["A written requirements document covering scope, pages/features, and what success looks like"],
  },
  {
    title: "Proposal & quote",
    duration: "1-2 business days",
    summary:
      "A written proposal covering scope, timeline, milestones, and a fixed price - so you know exactly what you're agreeing to before anything is booked.",
    deliverables: [
      "A written proposal with a fixed price, timeline, and milestones",
      "Room to review and negotiate scope before agreeing to anything",
    ],
  },
  {
    title: "Advance payment",
    duration: "Same day",
    summary:
      "Once you approve the proposal, an advance payment confirms the engagement and reserves the team's time to start work.",
    deliverables: ["A confirmed start date, with your project's time reserved on the team's schedule"],
    fromYou: ["The agreed advance payment, per the approved proposal"],
  },
  {
    title: "Design",
    duration: "3-5 business days",
    summary:
      "Real screens built around your actual content and brand, not a generic template - reviewed and revised with you before development starts.",
    deliverables: [
      "Real screens for your actual content and brand, not placeholder text",
      "Revisions before development starts, so a change request never means rebuilding something already coded",
    ],
    fromYou: ["Feedback on design drafts, plus brand assets if you have them (logo, colors, existing content)"],
  },
  {
    title: "Development",
    duration: "5-10 business days",
    summary:
      "Built in visible stages on a staging environment you can check in on throughout, not a black box until the big reveal.",
    deliverables: ["A staging link to a real, running version of your build - not a black box until the reveal"],
    fromYou: ["Timely feedback during check-ins, so progress never sits waiting on a reply"],
  },
  {
    title: "Testing",
    duration: "1-2 business days",
    summary:
      "Checked against real devices, browsers, and edge cases - and against performance and accessibility standards - before anything reaches your users.",
    deliverables: ["A build checked across real devices and browsers, and against performance/accessibility standards"],
  },
  {
    title: "Deployment",
    duration: "Same day",
    summary:
      "Launched onto hosting and a domain you control, with a clean handover of source code and access - nothing held back once the project is paid.",
    deliverables: ["A live product on hosting and a domain you control, with source code and access handed to you"],
    fromYou: ["Access to your domain registrar/DNS, if you'd like it connected at launch"],
  },
  {
    title: "Support",
    duration: "30 days",
    summary:
      "A defined post-launch window to fix anything that comes up once real users start clicking around - software needs upkeep, not a one-time handoff.",
    deliverables: ["A month of post-launch support to fix anything that surfaces once real users are on it"],
  },
];

const PROCESS_FAQ_ITEMS: FAQItem[] = [
  {
    question: "What happens right after I submit the contact form?",
    answer:
      "We reach out to set up the discovery call - usually the same day. That call is a real conversation, not a sales pitch: we're trying to understand what you actually need before anything is proposed.",
  },
  {
    question: "What happens if I don't like the initial design?",
    answer:
      "Design happens before development starts specifically so this isn't a problem - you review and request changes to the screens themselves, and nothing gets coded until you're genuinely happy with the direction.",
  },
  {
    question: "What if my requirements change partway through the project?",
    answer:
      "That's normal, not a problem. The project runs in stages specifically so a change in one stage doesn't mean redoing everything that came before it - we'll talk through what the change affects and adjust from there.",
  },
  {
    question: "Do I need to be available every day while you're building?",
    answer:
      "No - development runs on a staging link with scheduled check-ins, not a requirement to be on call. We just ask that when we do reach out for feedback, it doesn't sit for days, since that's what actually slows a timeline down.",
  },
  {
    question: "What do you need from me during the project?",
    answer:
      "It varies by stage - see the \"What we need from you\" notes above. In short: your advance payment to start, feedback during design and development, and domain/DNS access if you want us to connect it at launch.",
  },
  {
    question: "What happens if a stage takes longer than planned?",
    answer:
      "You hear about it before the deadline passes, not after - with a reason and a revised date. The proposal's timeline is a real commitment, not a placeholder, but we'd rather flag a slip early than let it become a surprise.",
  },
  {
    question: "Can I see progress before the site is finished?",
    answer:
      "Yes - a staging link goes live at the start of development, so you're looking at the real, running build throughout, not waiting for a single reveal at the end.",
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
 * client actually has, and it's deliberately the *definitive* answer - the
 * homepage and /website-development each show their own abbreviated 5/7-step
 * teaser via ProcessTimeline and link here for the real depth: typical
 * duration, what you receive, and what's needed from you at every one of
 * these nine stages (ProcessStageDetailList, expand-on-demand so the page
 * stays scannable at a glance and detailed on request - see
 * process-stage-detail.tsx). The FAQ below is deliberately different from
 * /website-development's pricing/tech FAQ - these are the process-specific
 * hesitations (what if I don't like the design, what if requirements
 * change) that a form alone never answers.
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: PROCESS_FAQ_ITEMS.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />

      <HeroSection
        eyebrow="Our process"
        heading="What happens after you contact us"
        subheading="Nine defined stages, the same way for every project - with the timeline, deliverables, and what we need from you at each one, so nothing is a surprise."
        primaryCta={{ label: "Start a project", href: "/start-project" }}
        secondaryCta={{ label: "See our pricing", href: "/pricing" }}
      />

      <ProcessStageDetailList
        eyebrow="Start to finish"
        heading="From first call to live product"
        description="Every engagement runs through these nine stages, in this order. Tap any stage for the timeline, what you'll receive, and what we need from you."
        stages={STAGES}
      />

      <WhyChooseStively heading="Why we work this way" reasons={WHY_THIS_ORDER} />

      <FAQSection heading="Questions about how we work" items={PROCESS_FAQ_ITEMS} />

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
