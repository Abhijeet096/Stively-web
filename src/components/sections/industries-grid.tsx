import { Rocket, ShoppingCart, GraduationCap, Landmark, HeartPulse, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

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
      <Container className="flex flex-col gap-10">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
          Industries we build for
        </h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {INDUSTRIES.map((industry) => (
            <div key={industry.label} className="flex flex-col items-center gap-2 text-center">
              <industry.icon className="text-primary size-6" aria-hidden="true" />
              <span className="text-foreground text-sm font-medium">{industry.label}</span>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { IndustriesGrid };
