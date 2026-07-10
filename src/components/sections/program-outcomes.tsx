import { Check } from "lucide-react";
import type { Program } from "@prisma/client";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

function ProgramOutcomes({ program }: { program: Program }) {
  if (program.outcomes.length === 0) return null;

  return (
    <Section background="muted">
      <Container className="flex flex-col gap-8">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          What you&apos;ll be able to do
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {program.outcomes.map((outcome: string) => (
            <li key={outcome} className="flex items-start gap-3">
              <Check className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span className="text-foreground">{outcome}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export { ProgramOutcomes };
