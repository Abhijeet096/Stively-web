"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Magnetic } from "@/components/shared/magnetic-button";
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
 * Pricing) - not Home-specific content baked in. Light background (AD-022's
 * theme-scope follow-up: the founder loved the Digital Store hero's light,
 * gradient-text-on-white treatment enough to want it as the shared hero
 * across every page that uses this component - the dark "ink" bookend stays
 * only on BusinessProcess/CTASection/Footer, per the founder's own scoped
 * decision, not removed everywhere). Runs one orchestrated page-load reveal
 * (eyebrow -> heading -> subheading -> ctas, pure CSS via the `hero-reveal`
 * keyframe in globals.css, see heroRevealStyle below) so it runs from first
 * paint instead of waiting on JS hydration. Every other section keeps the
 * plain scroll-triggered Reveal pattern.
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
  const auroraRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const auroraEl = auroraRef.current;
    if (!auroraEl) return;

    // Dynamic import, not a static one - this is every marketing page's
    // hero, so a top-level `import ... from "@/lib/animations"` here would
    // put the full animejs library on the critical path of every page on
    // the site. Deferring it into the effect lets the rest of the page
    // (including the hero heading itself, which is pure CSS - see
    // heroRevealStyle above) paint and hydrate without waiting on it; the
    // aurora drift is decorative, aria-hidden, and never an LCP candidate,
    // so a beat's delay is invisible.
    let cancelled = false;
    // The aurora orb loops forever once started (see observeDriftOrb's own
    // comment) - most heroes render above the fold and never leave the
    // viewport, but this keeps the cost bounded (and correctly zero while
    // off-screen) for the ones that don't, at no cost to the ones that do.
    let stopOrb: (() => void) | undefined;
    import("@/lib/animations").then(({ observeDriftOrb }) => {
      if (cancelled) return;
      stopOrb = observeDriftOrb(auroraEl, 32, 11000);
    });
    return () => {
      cancelled = true;
      stopOrb?.();
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
        <Button size="lg" variant="primary" asChild className="w-full sm:w-auto">
          <Link href={primaryCta.href}>{primaryCta.label}</Link>
        </Button>
      </Magnetic>
      {secondaryCta && (
        <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
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
        "text-primary bg-primary/10 inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide uppercase",
        eyebrowMono && "font-mono tracking-widest"
      )}
    >
      {eyebrow}
    </span>
  );

  // Two soft, low-opacity radial gradients against the light --background
  // canvas - the same values Digital Store's own hero already used (see
  // digital-store/page.tsx), reused here rather than re-tuned so every hero
  // reads as one consistent treatment rather than a close approximation.
  // Given a slow ambient drift via driftOrb (reduced-motion and
  // reduced-data safe - the function itself no-ops under
  // prefers-reduced-motion).
  const aurora = (
    <div
      ref={auroraRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        background:
          "radial-gradient(ellipse 800px 500px at 10% 0%, oklch(0.541 0.216 265.75 / 0.08), transparent 60%)," +
          "radial-gradient(ellipse 700px 500px at 100% 20%, oklch(0.746 0.127 200.01 / 0.07), transparent 60%)",
      }}
    />
  );

  if (visual) {
    return (
      <Section
        id={id}
        background="default"
        className="relative overflow-hidden pt-10 pb-24 md:pt-14 md:pb-32 lg:pt-14 lg:pb-32"
      >
        {aurora}
        <Container className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-10">
          <div className="relative flex flex-col items-center gap-5 text-center lg:w-[55%] lg:shrink-0 lg:items-start lg:text-left">
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
              className="text-muted-foreground max-w-xl text-lg text-pretty"
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
    <Section id={id} background="default" className="relative overflow-hidden py-24 md:py-32">
      {aurora}
      <Container className="relative flex flex-col items-center gap-6 text-center">
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
          className="text-muted-foreground max-w-2xl text-lg text-pretty"
        >
          {subheading}
        </p>
        {ctas}
      </Container>
    </Section>
  );
}

export { HeroSection };
