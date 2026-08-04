"use client";

import * as React from "react";
import { Check, User } from "lucide-react";

import { driftOrb, linkPathDrawToScroll } from "@/lib/animations";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Badge } from "@/components/ui/badge";
import { SignalPath } from "@/components/sections/signal-path";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export interface ProcessStageDetail {
  title: string;
  duration: string;
  summary: string;
  deliverables: string[];
  /** What the client needs to provide during this stage - omitted for stages that are entirely on Stively's side. */
  fromYou?: string[];
}

export interface ProcessStageDetailListProps {
  id?: string;
  eyebrow?: string;
  heading: string;
  description?: string;
  stages: ProcessStageDetail[];
}

/**
 * /process's own deep-dive version of the "numbered ink timeline" motif
 * ProcessTimeline (process-timeline.tsx) already uses on the homepage and
 * /website-development - not a replacement for that component, a different
 * one for a different job. Those pages tease a fast, scannable sequence;
 * this page's entire purpose is to be "the detailed, definitive version"
 * (see /process/page.tsx's own comment), so each stage opens into real
 * duration/deliverables/from-you detail via Accordion instead of staying a
 * one-line summary. `type="multiple"` (not FAQSection's `single collapsible`)
 * because comparing two adjacent stages side by side while reading through
 * a sequence is a reasonable thing to want, unlike a flat FAQ list.
 */
function ProcessStageDetailList({
  id,
  eyebrow = "In detail",
  heading,
  description,
  stages,
}: ProcessStageDetailListProps) {
  const auroraRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);

  React.useEffect(() => {
    const orb = auroraRef.current ? driftOrb(auroraRef.current, 24, 10000) : null;
    const unlinkPath =
      pathRef.current && listRef.current ? linkPathDrawToScroll(pathRef.current, listRef.current) : null;
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
          {description && <p className="text-ink-muted-foreground max-w-xl text-pretty">{description}</p>}
        </Reveal>

        <div ref={listRef} className="relative mx-auto w-full max-w-2xl">
          <SignalPath
            ref={pathRef}
            d="M1 0 L1 100"
            viewBox="0 0 2 100"
            className="absolute top-[22px] left-[18px] h-[calc(100%-44px)] w-px -translate-x-1/2"
          />
          <Accordion type="multiple" className="flex flex-col gap-1">
            {stages.map((stage, index) => (
              <Reveal key={stage.title} delay={index * 70}>
                <AccordionItem value={`stage-${index}`} className="border-none">
                  <AccordionTrigger className="group hover:no-underline [&>svg]:text-ink-muted-foreground gap-4 py-2 pl-0 hover:[&>svg]:text-ink-foreground">
                    <span className="flex flex-1 items-start gap-5 text-left">
                      <span
                        className="border-primary text-primary-foreground bg-ink relative z-10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums"
                        style={{ boxShadow: "var(--shadow-glow)" }}
                      >
                        {index + 1}
                      </span>
                      <span className="flex flex-1 flex-col gap-1.5 pt-0.5 pb-1">
                        <span className="flex flex-wrap items-center gap-2.5">
                          <span className="text-ink-foreground text-lg font-semibold">{stage.title}</span>
                          <Badge variant="ink" className="font-mono text-[10px] tracking-wide uppercase">
                            {stage.duration}
                          </Badge>
                        </span>
                        <span className="text-ink-muted-foreground text-sm text-pretty">{stage.summary}</span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-ink-muted-foreground pt-0 pb-6 pl-14">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <span className="text-ink-foreground/70 text-xs font-medium tracking-wide uppercase">
                          What you get
                        </span>
                        <ul className="flex flex-col gap-1.5">
                          {stage.deliverables.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm">
                              <Check className="text-brand-teal mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                              <span className="text-ink-foreground/90">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {stage.fromYou && stage.fromYou.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-ink-foreground/70 text-xs font-medium tracking-wide uppercase">
                            What we need from you
                          </span>
                          <ul className="flex flex-col gap-1.5">
                            {stage.fromYou.map((item) => (
                              <li key={item} className="flex items-start gap-2 text-sm">
                                <User className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                <span className="text-ink-foreground/90">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Reveal>
            ))}
          </Accordion>
        </div>
      </Container>
    </Section>
  );
}

export { ProcessStageDetailList };
