import type { Metadata } from "next";
import { Eye, MessageCircle, ShieldCheck } from "lucide-react";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";
import { HeroSection } from "@/components/sections/hero-section";
import { ContactMethods } from "@/components/sections/contact-methods";
import { ContactForm } from "@/components/forms/contact-form";
import { WhyChooseStively, type Reason } from "@/components/sections/why-choose-stively";
import { FAQSection, type FAQItem } from "@/components/sections/faq-section";
import { CTASection } from "@/components/sections/cta-section";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Stively - whether you're a student exploring training programs or a business with a project in mind.",
  alternates: { canonical: "/contact" },
};

const TRUST_REASONS: Reason[] = [
  {
    icon: MessageCircle,
    title: "We actually reply",
    description: "Every message reaches a real person - we usually respond within a day.",
  },
  {
    icon: Eye,
    title: "No pressure, no hard sell",
    description:
      "Reaching out doesn't commit you to anything - it's a conversation, not a sales funnel.",
  },
  {
    icon: ShieldCheck,
    title: "The same trust standard, either way",
    description:
      "Whether you're exploring a program or a project, you get a straight answer - see it in our process on the Services page.",
  },
];

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How quickly will you respond?",
    answer: "We usually reply within a day.",
  },
  {
    question: "I'm not sure if I should reach out as a student or a business - does it matter?",
    answer:
      "Pick whichever feels closer. It just helps us route your message to the right person faster - either way, a real person reads it.",
  },
  {
    question: "Do you sign NDAs for business enquiries?",
    answer: "Yes - happy to sign one before discussing any specifics of your project.",
  },
  {
    question: "I already sent a message - should I submit the form again?",
    answer:
      "No need. If you haven't heard back within a couple of days, just reply to your original email rather than submitting again.",
  },
];

/**
 * No Prisma queries on this page - entirely static content plus one client
 * form island, same pattern as the Services page. No loading.tsx needed for
 * the same reason (design-system.md §21 - loading states are for content
 * that's about to appear; nothing here is fetched).
 */
export default function ContactPage() {
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
              name: "Contact",
              item: `${siteConfig.url}/contact`,
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
        eyebrow="Contact"
        heading="Let's talk"
        subheading="Whether you're a student exploring a program or a business with a project in mind - tell us what's on your mind and we'll get back to you."
        primaryCta={{ label: "Send a message", href: "#contact-form" }}
      />

      <ContactMethods />

      <Section id="contact-form" background="default">
        <Container className="flex justify-center">
          <Card className="w-full max-w-xl">
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </Container>
      </Section>

      <WhyChooseStively heading="Why reach out to Stively" reasons={TRUST_REASONS} />
      <FAQSection items={FAQ_ITEMS} />

      <CTASection
        heading="Still deciding?"
        description="There's no wrong reason to reach out - ask us anything."
        actionLabel="Send a message"
        actionHref="#contact-form"
        inverted
      />
    </>
  );
}
