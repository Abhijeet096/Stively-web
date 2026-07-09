import Link from "next/link";
import type { Program } from "@prisma/client";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/components/sections/program-card";

export interface ProgramsOverviewProps {
  programs: Program[];
}

/**
 * Omitted entirely by the Home page when `programs` is empty - per Phase E,
 * an empty section on a marketing page reads as broken, not "coming soon."
 * This component doesn't defend against that itself; the caller decides
 * whether to render it at all (see src/app/page.tsx).
 */
function ProgramsOverview({ programs }: ProgramsOverviewProps) {
  return (
    <Section background="default">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Training programs</h2>
          <p className="text-muted-foreground max-w-xl">
            Practical, cohort-based programs built around real outcomes, not just topics.
          </p>
        </div>

        {/* Mobile: horizontal scroll. Desktop (md+): 3-column grid. */}
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
          {programs.map((program) => (
            <div key={program.id} className="w-[80%] shrink-0 snap-start md:w-auto">
              <ProgramCard program={program} />
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/training">View all programs</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export { ProgramsOverview };
