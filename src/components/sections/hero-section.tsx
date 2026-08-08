"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { playHeroLoadTimeline, driftOrb } from "@/lib/animations";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Magnetic } from "@/components/shared/magnetic-button";
import { SignalPath } from "@/components/sections/signal-path";
import { Button } from "@/components/ui/button";

export interface HeroCta {
  label: string;
  href: string;
}

/**
 * Inline style for the CSS-only `hero-reveal` keyframe (see globals.css) -
 * rendered directly into the SSR'd HTML so the browser can animate it in
 * from first paint without waiting on hydration. Timing/distance values
 * match the original animejs timeline's per-element offsets.
 */
function heroRevealStyle(delayMs: number, durationMs: number, distancePx: number): React.CSSProperties {
  return {
    animation: `hero-reveal ${durationMs}ms cubic-bezier(0.22,1,0.36,1) ${delayMs}ms both`,
    "--hero-reveal-y": `${distancePx}px`,
  } as React.CSSProperties;
}

export interface HeroSectionProps {
  /** For a page's sticky CTA bar (see service-sticky-cta.tsx) to watch via IntersectionObserver. */
  id?: string;
  eyebrow?: string;
  /** Plain string on every existing caller (unchanged); accepts a ReactNode so a phrase can carry a gradient-text accent (see Home's usage) without a separate prop. */
  heading: React.ReactNode;
  subheading: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
  /**
   * A supporting visual (product/process mockup, not a stock photo) shown
   * beside the headline in an asymmetric split on lg+ screens. Optional and
   * additive - every existing caller (About/Services/Contact/Training)
   * that doesn't pass this keeps the exact original centered layout,
   * unchanged.
   */
  visual?: React.ReactNode;
  /** Monospace eyebrow instead of the default sans caption - an engineered, technical feel for the one hero that should read that way. */
  eyebrowMono?: boolean;
}

/**
 * Reusable across marketing pages (Home now, About/Services/Training/
 * Pricing) - not Home-specific content baked in. Runs one orchestrated
 * page-load reveal (eyebrow -> heading -> signal-path draw -> subheading ->
 * ctas, ~600-800ms total) - the one deliberate page-load animation on the
 * site, justified by the "signal path" motif this hero introduces (see
 * docs/design-system.md's typography/motion addendum). The text/CTA fade-up
 * is pure CSS (`hero-reveal` in globals.css, see heroRevealStyle below) so
 * it runs from first paint instead of waiting on JS hydration - only the
 * signal-path's "drawn" progress still needs animejs (src/lib/animations.ts).
 * Every other section keeps the plain scroll-triggered Reveal pattern.
 */
function HeroSection({
  id,
  eyebrow,
  heading,
  subheading,
  primaryCta,
  secondaryCta,
  visual,
  eyebrowMono = false,
}: HeroSectionProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const auroraRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const timeline = playHeroLoadTimeline(root);
    const orb = auroraRef.current ? driftOrb(auroraRef.current, 32, 11000) : null;
    return () => {
      timeline?.revert();
      orb?.revert();
    };
  }, []);

  const ctas = (
    <div
      data-hero-ctas
      style={heroRevealStyle(420, 450, 10)}
      className={cn(
        "flex w-full flex-col gap-3 sm:w-auto sm:flex-row",
        visual && "sm:justify-start"
      )}
    >
      <Magnetic>
        <Button size="lg" variant="inverse" asChild className="w-full sm:w-auto">
          <Link href={primaryCta.href}>{primaryCta.label}</Link>
        </Button>
      </Magnetic>
      {secondaryCta && (
        <Button size="lg" variant="outline-inverse" asChild className="w-full sm:w-auto">
          <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
        </Button>
      )}
    </div>
  );

  const eyebrowEl = eyebrow && (
    <span
      data-hero-eyebrow
      style={heroRevealStyle(0, 450, 8)}
      className={cn(
        "border-ink-border-strong text-ink-muted-foreground inline-flex items-center gap-2 rounded-full border bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium tracking-wide uppercase",
        eyebrowMono && "text-primary-foreground font-mono tracking-widest"
      )}
    >
      <span
        aria-hidden="true"
        className="from-primary via-brand-iris to-brand-teal size-1.5 rounded-full bg-linear-to-br"
      />
      {eyebrow}
    </span>
  );

  // Richer multi-stop aurora mesh (indigo -> iris -> teal -> a warm edge
  // glow) against the --ink canvas, paired with a faint dot grid for
  // engineered texture (Stripe's gradient-mesh-hero crossed with Vercel/
  // Raycast's dot-grid restraint) - a mechanical upgrade of the previous
  // 3-stop version tuned for a dark surface instead of white. Given a slow
  // ambient drift via driftOrb (reduced-motion and reduced-data safe - the
  // function itself no-ops under prefers-reduced-motion).
  const aurora = (
    <>
      <div
        ref={auroraRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 1000px 560px at 12% 8%, oklch(0.541 0.216 265.75 / 0.35), transparent 60%)," +
            "radial-gradient(ellipse 700px 520px at 48% -5%, oklch(0.58 0.19 232.9 / 0.28), transparent 55%)," +
            "radial-gradient(ellipse 760px 600px at 92% 55%, oklch(0.746 0.127 200.01 / 0.22), transparent 55%)," +
            "radial-gradient(ellipse 500px 400px at 20% 90%, oklch(0.541 0.216 265.75 / 0.14), transparent 60%)",
        }}
      />
      <div
        aria-hidden="true"
        className="text-ink-foreground/[0.05] bg-dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]"
      />
    </>
  );

  // The signal-path motif's ambient appearance - a loose gesture from the
  // eyebrow through the headline, drawn once by the hero load timeline
  // (src/lib/animations.ts). Deliberately abstract rather than pixel-
  // aligned to HeroVisual's exact DOM position, so it stays correct across
  // every breakpoint instead of a fragile cross-component coordinate match.
  const signalPath = (
    <SignalPath
      d="M4 40 C 80 10, 160 55, 240 22 S 380 8, 460 30"
      viewBox="0 0 460 60"
      className="absolute -top-6 left-0 h-10 w-full max-w-md opacity-70 sm:left-1/2 sm:-translate-x-1/2 lg:left-0 lg:translate-x-0"
    />
  );

  if (visual) {
    return (
      <Section
        id={id}
        ref={rootRef}
        background="inverted"
        className="texture-noise relative overflow-hidden pt-10 pb-16 md:pt-12 md:pb-20 lg:pt-12 lg:pb-20"
      >
        {aurora}
        <Container className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-10">
          <div className="relative flex flex-col items-center gap-5 text-center lg:w-[55%] lg:shrink-0 lg:items-start lg:text-left">
            {signalPath}
            {eyebrowEl}
            <h1
              data-hero-heading
              className="font-display text-balance font-semibold tracking-[-0.03em]"
              style={{
                fontSize: "clamp(2.25rem, 4.2vw, 3.75rem)",
                lineHeight: 1.05,
                ...heroRevealStyle(80, 650, 18),
              }}
            >
              {heading}
            </h1>
            <p
              data-hero-subheading
              style={heroRevealStyle(300, 500, 12)}
              className="text-ink-muted-foreground max-w-xl text-lg text-pretty"
            >
              {subheading}
            </p>
            {ctas}
          </div>
          <div className="w-full lg:flex-1">{visual}</div>
        </Container>
      </Section>
    );
  }

  return (
    <Section
      id={id}
      ref={rootRef}
      background="inverted"
      className="texture-noise relative overflow-hidden py-24 md:py-32"
    >
      {aurora}
      <Container className="relative flex flex-col items-center gap-6 text-center">
        {signalPath}
        {eyebrowEl}
        <h1
          data-hero-heading
          style={heroRevealStyle(80, 650, 18)}
          className="font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl md:text-6xl"
        >
          {heading}
        </h1>
        <p
          data-hero-subheading
          style={heroRevealStyle(300, 500, 12)}
          className="text-ink-muted-foreground max-w-2xl text-lg text-pretty"
        >
          {subheading}
        </p>
        {ctas}
      </Container>
    </Section>
  );
}

export { HeroSection };
