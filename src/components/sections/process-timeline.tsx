"use client";

import * as React from "react";

import { driftOrb, linkPathDrawToScroll } from "@/lib/animations";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { Eyebrow } from "@/components/shared/eyebrow";
import { SignalPath } from "@/components/sections/signal-path";

export interface ProcessStep {
  title: string;
  description: string;
}

export interface ProcessTimelineProps {
  id?: string;
  eyebrow?: string;
  heading: string;
  description?: string;
  steps: ProcessStep[];
}

/**
 * Generalized out of business-process.tsx (which now just calls this with
 * its original 5 homepage steps, unchanged) so any page can show its own
 * real sequence of steps through the same "animated timeline" visual
 * language - the signal-path connector's draw progress tied to scroll
 * position through the list, on the same dark --ink surface as the
 * Hero/closing CTA - rather than each page reinventing the pattern or, worse,
 * every page rendering the identical homepage component with the wrong
 * steps for what it's describing.
 */
function ProcessTimeline({
  id,
  eyebrow = "How we work",
  heading,
  description,
  steps,
}: ProcessTimelineProps) {
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
    <Section id={id} background="inverted" className="texture-noise relative overflow-hidden">
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
          <Eyebrow tone="inverse">{eyebrow}</Eyebrow>
          <h2 className="text-ink-foreground font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            {heading}
          </h2>
          {description && (
            <p className="text-ink-muted-foreground max-w-xl text-pretty">{description}</p>
          )}
        </Reveal>

        <ol ref={timelineRef} className="relative mx-auto flex w-full max-w-2xl flex-col">
          <SignalPath
            ref={pathRef}
            d="M1 0 L1 100"
            viewBox="0 0 2 100"
            className="absolute top-[18px] left-[18px] h-[calc(100%-58px)] w-px -translate-x-1/2"
          />
          {steps.map((step, index) => (
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

export { ProcessTimeline };
