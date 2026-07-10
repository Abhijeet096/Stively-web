import Link from "next/link";
import type { Program } from "@prisma/client";

import { formatPrice } from "@/lib/utils";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LEVEL_LABEL: Record<Program["level"], string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const MODE_LABEL: Record<Program["mode"], string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  HYBRID: "Hybrid",
};

/**
 * "Enroll Now" links to /signup (not built yet, out of scope for this page)
 * with a callbackUrl per the Phase D authentication flow doc - same pattern
 * already used by Home linking forward to /training before that page
 * existed. Payment and auth are explicitly out of scope here; this is just
 * the correct eventual destination.
 */
function ProgramHero({ program }: { program: Program }) {
  const enrollHref = `/signup?callbackUrl=/training/${program.slug}`;

  return (
    <Section id="program-hero" background="default" className="py-16 md:py-20">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{LEVEL_LABEL[program.level]}</Badge>
          <Badge variant="outline">{MODE_LABEL[program.mode]}</Badge>
          <Badge variant="outline">{program.durationWeeks} weeks</Badge>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          {program.title}
        </h1>

        <p className="text-muted-foreground max-w-2xl text-lg">{program.shortDescription}</p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <span className="text-foreground text-2xl font-semibold">
            {formatPrice(program.price, program.currency)}
          </span>
          <Button size="lg" asChild>
            <Link href={enrollHref}>Enroll Now</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export { ProgramHero };
