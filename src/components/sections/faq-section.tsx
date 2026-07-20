import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  heading?: string;
  items: FAQItem[];
}

/**
 * Generic and reusable by design - not named ServicesFAQ, since the same
 * shape is needed by the future /faq page and the FAQ teaser flagged (but
 * not built) on the Training listing page. Reuses the Accordion primitive
 * built for Program Detail's Curriculum section rather than a new pattern.
 */
function FAQSection({ heading = "Frequently asked questions", items }: FAQSectionProps) {
  return (
    <Section background="default">
      <Container className="flex flex-col items-center gap-8">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="font-display text-center text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          {heading}
        </h2>
        <Accordion type="single" collapsible className="mx-auto w-full max-w-2xl">
          {items.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </Section>
  );
}

export { FAQSection };
