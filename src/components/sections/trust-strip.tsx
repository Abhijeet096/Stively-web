import { ShieldCheck, Eye, Users, FileCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";

interface TrustPoint {
  icon: LucideIcon;
  label: string;
}

const TRUST_POINTS: TrustPoint[] = [
  { icon: Users, label: "Every developer trained and evaluated first" },
  { icon: Eye, label: "You see the plan and progress, no black box" },
  { icon: ShieldCheck, label: "Direct access to the people building it" },
  { icon: FileCheck, label: "NDA on request, before any details are shared" },
];

/**
 * Sits directly under the Hero, before any other content - premium B2B
 * sites (Stripe, Clerk) put trust signals immediately after the headline,
 * not several scrolls down. Deliberately NOT client logos or stats - none
 * exist yet to show honestly (see AGENTS.md's no-fabricated-content rule).
 * These four are real, verifiable claims about how Stively actually
 * operates, not outcomes it can't yet back with numbers.
 */
function TrustStrip() {
  return (
    <div className="border-border bg-muted/40 relative border-y py-10">
      <Container className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_POINTS.map((point, index) => (
          <Reveal key={point.label} delay={index * 80}>
            <div className="group border-border bg-surface-elevated hover:border-primary/30 flex h-full items-start gap-3 rounded-lg border p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-glow">
              <span className="from-primary/15 to-primary/5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                <point.icon className="text-primary size-4.5" aria-hidden="true" />
              </span>
              <span className="text-foreground pt-1.5 text-sm font-medium">{point.label}</span>
            </div>
          </Reveal>
        ))}
      </Container>
    </div>
  );
}

export { TrustStrip };
