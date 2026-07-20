"use client";

import * as React from "react";

import { driftOrb, linkPathDrawToScroll } from "@/lib/animations";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { Eyebrow } from "@/components/shared/eyebrow";
import { SignalPath } from "@/components/sections/signal-path";

interface ProcessStep {
  title: string;
  description: string;
}

const STEPS: ProcessStep[] = [
  {
    title: "Discovery",
    description:
      "A conversation about what you actually need, before anything is scoped or promised.",
  },
  {
    title: "Proposal",
    description: "A clear plan, timeline, and fixed estimate you approve before work starts.",
  },
  {
    title: "Development",
    description: "Built in visible stages with regular check-ins - not a black box until launch.",
  },
  {
    title: "QA & launch",
    description: "Reviewed and tested against real usage before it reaches your users.",
  },
  {
    title: "Support",
    description: "We stay involved after launch - software needs upkeep, not a one-time handoff.",
  },
];

/**
 * A vertical timeline on a dark, "premium surface" background - the one
 * deliberately dark section in the page's rhythm (everything else is
 * light/muted), so scrolling has a real contrast beat instead of an
 * unbroken run of white sections. Also stands in for a "case study"
 * section: since no real client work exists yet to show honestly, this
 * answers "what does working with Stively actually look like" through the
 * real process itself instead of a fabricated project story. Kept
 * centered (unlike the sections above and below it) deliberately - variety
 * includes some sections staying symmetric, not forcing asymmetry
 * everywhere.
 *
 * The connector between steps is the literal appearance of the "signal
 * path" motif introduced in the Hero - one gradient line whose draw
 * progress is tied to how far the user has scrolled through these 5 real
 * steps (see src/lib/animations.ts's linkPathDrawToScroll), rather than a
 * static bar. The numbered circles stay - a real sequence earns them,
 * unlike a decorative 01/02/03 marker.
 */
function BusinessProcess() {
  const auroraRef = React.useRef<HTMLDivElement>(null);
  const timelineRef = React.useRef<HTMLOListElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);

  React.useEffect(() => {
    const orb = auroraRef.current ? driftOrb(auroraRef.current, 24, 10000) : null;
    const unlinkPath =
      pathRef.current && timelineRef.current
        ? linkPathDrawToScroll(pathRef.current, timelineRef.current)
        : null;
    return () => {
      orb?.revert();
      unlinkPath?.();
    };
  }, []);

  return (
    <Section
      id="how-we-work"
      background="inverted"
      className="texture-noise relative overflow-hidden"
    >
      {/* 3-stop aurora (indigo -> iris -> teal), the same treatment as the
          Hero's mesh, dimmer - ties the one other dark moment on the page
          back to the same brand-gradient language. */}
      <div
        ref={auroraRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 800px 500px at 85% 0%, oklch(0.541 0.216 265.75 / 0.16), transparent 60%)," +
            "radial-gradient(ellipse 600px 450px at 50% 45%, oklch(0.58 0.19 232.9 / 0.08), transparent 55%)," +
            "radial-gradient(ellipse 600px 500px at 5% 100%, oklch(0.746 0.127 200.01 / 0.1), transparent 55%)",
        }}
      />
      <Container className="relative flex flex-col gap-12">
        <Reveal className="flex flex-col items-center gap-3 text-center">
          <Eyebrow tone="inverse">How we work</Eyebrow>
          <h2 className="text-ink-foreground font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            How an engagement actually runs
          </h2>
          <p className="text-ink-muted-foreground max-w-xl">
            Five stages, the same way every time - so you always know what happens next.
          </p>
        </Reveal>

        <ol ref={timelineRef} className="relative mx-auto flex w-full max-w-2xl flex-col">
          <SignalPath
            ref={pathRef}
            d="M1 0 L1 100"
            viewBox="0 0 2 100"
            // Explicit height (not `bottom-*`) - an absolutely positioned SVG
            // with a definite width but no explicit height ignores top+bottom
            // stretch and falls back to sizing itself from the viewBox's
            // aspect ratio instead, collapsing to a few px tall.
            className="absolute top-[18px] left-[18px] h-[calc(100%-58px)] w-px -translate-x-1/2"
          />
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 90} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span
                    className="border-primary text-primary-foreground bg-ink relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums"
                    style={{ boxShadow: "var(--shadow-glow)" }}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="hover:border-ink-border hover:bg-white/[0.03] flex flex-1 flex-col gap-1.5 rounded-lg border border-transparent px-3 py-1 pb-10 transition-colors duration-200 ease-out">
                  <h3 className="text-ink-foreground text-lg font-semibold">{step.title}</h3>
                  <p className="text-ink-muted-foreground text-sm text-pretty">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export { BusinessProcess };
