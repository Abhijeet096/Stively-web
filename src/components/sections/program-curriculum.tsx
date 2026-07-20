import type { Program } from "@prisma/client";

import { parseSyllabus } from "@/lib/validations/program";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/**
 * Program.syllabus is untyped Json (see prisma/schema.prisma) - parsed and
 * validated via parseSyllabus() before rendering. A malformed or missing
 * syllabus omits this section entirely rather than crashing the page or
 * showing broken content, matching the same "omit, don't half-render" rule
 * used everywhere else on marketing pages.
 */
function ProgramCurriculum({ program }: { program: Program }) {
  const syllabus = parseSyllabus(program.syllabus);
  if (!syllabus || syllabus.modules.length === 0) return null;

  return (
    <Section background="default">
      <Container className="flex flex-col gap-8">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          Curriculum
        </h2>
        <Accordion type="single" collapsible className="w-full max-w-3xl">
          {syllabus.modules.map((module, index) => (
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
      </Container>
    </Section>
  );
}

export { ProgramCurriculum };
