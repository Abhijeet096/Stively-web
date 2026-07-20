import { Check } from "lucide-react";
import type { Program } from "@prisma/client";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

function ProgramOutcomes({ program }: { program: Program }) {
  if (program.outcomes.length === 0) return null;

  return (
    <Section background="muted">
      <Container className="flex flex-col gap-8">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          What you&apos;ll be able to do
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {program.outcomes.map((outcome: string) => (
            <li key={outcome} className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-foreground text-pretty">{outcome}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export { ProgramOutcomes };
