import { X, Check } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";

interface ComparisonRow {
  typical: string;
  stively: string;
}

const ROWS: ComparisonRow[] = [
  {
    typical: "Freelancers assembled per project, quality varies each time",
    stively: "A trained, evaluated talent pipeline - not a gig roster",
  },
  {
    typical: "You find out about delays after they've already happened",
    stively: "You see the plan, timeline, and progress as it happens",
  },
  {
    typical: "An account manager relays messages between you and the team",
    stively: "Direct access to the people actually building your software",
  },
  {
    typical: "Pricing surprises show up mid-project",
    stively: "Scoped and estimated before development starts, in writing",
  },
];

/**
 * The core "why trust us" section - reframed as a comparison rather than a
 * client-logo wall or stats bar, since neither exists yet to show honestly
 * (see AGENTS.md's no-fabricated-content rule). Every right-column claim is
 * a real, verifiable statement about how Stively operates, not an outcome
 * metric it can't back yet. "Typical agency" describes a common pattern,
 * not a named competitor.
 */
function WhyStivelyComparison() {
  return (
    <Section background="muted">
      <Container className="flex flex-col gap-10 lg:flex-row lg:gap-16">
        <Reveal className="flex flex-col gap-3 lg:w-1/3 lg:shrink-0">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            Not a freelancer roster. Not a black box.
          </h2>
          <p className="text-muted-foreground text-pretty">
            Most of what makes an agency risky isn&apos;t the work itself - it&apos;s not knowing
            who&apos;s doing it or what&apos;s happening until something goes wrong. Here&apos;s
            what we do differently.
          </p>
        </Reveal>

        <div className="flex flex-1 flex-col gap-3">
          {ROWS.map((row, index) => (
            <Reveal key={row.stively} delay={index * 70}>
              <div className="group border-border bg-card hover:border-primary/25 relative grid grid-cols-1 gap-0 overflow-hidden rounded-lg border shadow-xs transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-glow sm:grid-cols-2">
                {/* Top accent line, both brand colors - only reveals on hover so it reads as a response, not a static stripe. */}
                <span
                  aria-hidden="true"
                  className="from-primary to-brand-teal absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-linear-to-r transition-transform duration-300 ease-out group-hover:scale-x-100"
                />
                <div className="bg-surface-sunken flex items-start gap-3 p-4 sm:p-5">
                  <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full">
                    <X className="text-muted-foreground size-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-muted-foreground pt-0.5 text-sm">{row.typical}</span>
                </div>
                <div className="bg-primary/4 border-border flex items-start gap-3 border-t p-4 sm:border-t-0 sm:border-l sm:p-5">
                  <span className="bg-primary/15 flex size-6 shrink-0 items-center justify-center rounded-full">
                    <Check className="text-primary size-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-foreground pt-0.5 text-sm font-medium">{row.stively}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { WhyStivelyComparison };
