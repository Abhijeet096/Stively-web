import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";

interface RoadmapItem {
  label: string;
  status: "current" | "future";
}

/**
 * Sourced from docs/core/stively-core-blueprint-v1.md §13's revenue-stream
 * roadmap, not invented. "current" vs "future" is a real, meaningful
 * distinction here, not decoration - Training and Software Development are
 * live (see /training and /services); the rest are direction, not
 * capability, per the brief's explicit "do NOT promise features that don't
 * exist today."
 */
const ROADMAP: RoadmapItem[] = [
  { label: "Training programs", status: "current" },
  { label: "Software development", status: "current" },
  { label: "Internships", status: "future" },
  { label: "Corporate training", status: "future" },
  { label: "A connected talent ecosystem", status: "future" },
  { label: "AI-assisted productivity tools", status: "future" },
];

function LookingAhead() {
  return (
    <Section background="muted">
      <Container className="flex flex-col items-center gap-6 text-center">
        <Eyebrow>Roadmap</Eyebrow>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          Looking ahead
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Training and software development are what we deliver today. The direction we&apos;re
          building toward goes further - connecting learning, real work, and hiring into one
          ecosystem over time.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {ROADMAP.map((item) => (
            <Badge key={item.label} variant={item.status === "current" ? "default" : "outline"}>
              {item.label}
              {item.status === "future" && " (planned)"}
            </Badge>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { LookingAhead };
