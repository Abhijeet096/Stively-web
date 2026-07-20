import { Rocket, ShoppingCart, GraduationCap, Landmark, HeartPulse, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Reveal } from "@/components/shared/reveal";

interface Industry {
  icon: LucideIcon;
  label: string;
}

const INDUSTRIES: Industry[] = [
  { icon: Rocket, label: "Startups & SaaS" },
  { icon: ShoppingCart, label: "E-commerce & Retail" },
  { icon: GraduationCap, label: "Education & EdTech" },
  { icon: Landmark, label: "FinTech" },
  { icon: HeartPulse, label: "Healthcare" },
  { icon: Building2, label: "Enterprise" },
];

/**
 * Framed as "industries we build for" (positioning), not "industries we've
 * served" (a track-record claim we can't back yet) - deliberate tense
 * choice, not an oversight.
 */
function IndustriesGrid() {
  return (
    <Section background="muted">
      <Container className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eyebrow>Where we work</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            Industries we build for
          </h2>
        </div>
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {INDUSTRIES.map((industry, index) => (
            <Reveal key={industry.label} delay={index * 50}>
              <div className="border-border bg-card hover:border-primary/25 hover:shadow-sm flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition-all duration-300 ease-out hover:-translate-y-1">
                <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                  <industry.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-foreground text-sm font-medium">{industry.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { IndustriesGrid };
