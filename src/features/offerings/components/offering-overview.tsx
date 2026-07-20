import type { Offering } from "@prisma/client";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { parseOfferingCurriculum } from "../lib/curriculum";

/**
 * Overview (longDescription) + an optional Curriculum accordion, reusing
 * program-curriculum.tsx's exact "parse, omit if malformed/empty" pattern
 * for Offering.curriculum - same untyped-Json convention as
 * Program.syllabus, just under a new field name.
 */
function OfferingOverview({ offering }: { offering: Offering }) {
  const curriculum = parseOfferingCurriculum(offering.curriculum);

  return (
    <Section background="default">
      <Container className="flex flex-col gap-8">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          Overview
        </h2>
        <p className="text-foreground max-w-3xl text-lg text-pretty">{offering.longDescription}</p>

        {curriculum && curriculum.modules.length > 0 && (
          <Accordion type="single" collapsible className="w-full max-w-3xl">
            {curriculum.modules.map((module, index) => (
              <AccordionItem key={module.title} value={`module-${index}`}>
                <AccordionTrigger>{module.title}</AccordionTrigger>
                <AccordionContent>
                  <ul className="flex flex-col gap-1.5">
                    {module.topics.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Container>
    </Section>
  );
}

export { OfferingOverview };
