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
    <Section
      id="program-hero"
      background="inverted"
      className="texture-noise relative overflow-hidden py-20 md:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 900px 500px at 10% 0%, oklch(0.541 0.216 265.75 / 0.32), transparent 60%)," +
            "radial-gradient(ellipse 650px 450px at 90% 30%, oklch(0.746 0.127 200.01 / 0.18), transparent 55%)",
        }}
      />
      <Container className="relative flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="ink">{LEVEL_LABEL[program.level]}</Badge>
          <Badge variant="ink">{MODE_LABEL[program.mode]}</Badge>
          <Badge variant="ink">{program.durationWeeks} weeks</Badge>
        </div>

        <h1 className="font-display text-4xl font-semibold tracking-[-0.025em] text-balance md:text-5xl">
          {program.title}
        </h1>

        <p className="text-ink-muted-foreground max-w-2xl text-lg text-pretty">
          {program.shortDescription}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <span className="text-ink-foreground font-display text-2xl font-semibold tabular-nums">
            {formatPrice(program.price, program.currency)}
          </span>
          <Button size="lg" variant="inverse" asChild>
            <Link href={enrollHref}>Enroll now</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export { ProgramHero };
