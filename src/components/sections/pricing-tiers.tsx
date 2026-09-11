"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { PRICING_TIERS, type PricingTier } from "@/lib/pricing";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { Eyebrow } from "@/components/shared/eyebrow";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// The Business tier gets the "strongest visual emphasis" the brief calls
// for by inverting to the same --ink surface as Hero/Process/Footer,
// scaling up, and floating above its siblings - not just a colored ribbon
// on an otherwise-identical card (Cursor/Stripe/Framer's "featured tier =
// a different surface" pattern, applied to Stively's own ink token).
function PricingCard({ tier, index }: { tier: PricingTier; index: number }) {
  const priceRef = React.useRef<HTMLParagraphElement>(null);

  React.useEffect(() => {
    const el = priceRef.current;
    if (!el) return;

    // Dynamic import - see lib/animations.ts's module comment. Homepage
    // and /pricing both render three of these at once, so this is real
    // weight to keep off the initial bundle for a count-up that only fires
    // once the card scrolls into view anyway.
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    import("@/lib/animations").then(({ countUpPrice }) => {
      if (cancelled) return;
      cleanup = countUpPrice(el, tier.priceInPaise, formatPrice);
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [tier.priceInPaise]);

  return (
    <Reveal
      delay={index * 70}
      className={cn("h-full", tier.highlighted && "lg:-translate-y-6 lg:scale-[1.04]")}
    >
      <Card
        variant={tier.highlighted ? "ink" : "default"}
        className={cn(
          "relative flex h-full flex-col gap-6 overflow-hidden",
          tier.highlighted ? "border-0" : "border-border"
        )}
        style={
          tier.highlighted
            ? { boxShadow: "var(--shadow-ink-card), var(--shadow-glow-xl)" }
            : undefined
        }
      >
        {tier.highlighted && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 420px 260px at 100% 0%, oklch(0.541 0.216 265.75 / 0.35), transparent 60%)," +
                  "radial-gradient(ellipse 360px 260px at 0% 100%, oklch(0.746 0.127 200.01 / 0.22), transparent 60%)",
              }}
            />
            <span
              aria-hidden="true"
              className="from-primary via-brand-iris to-brand-teal absolute inset-x-0 top-0 h-1 bg-linear-to-r"
            />
            <Badge variant="gradient" className="absolute top-5 right-5">
              Recommended
            </Badge>
          </>
        )}
        <CardHeader className="relative">
          <CardTitle className={cn("text-lg", tier.highlighted && "font-display text-xl")}>
            {tier.name}
          </CardTitle>
          <CardDescription className={tier.highlighted ? "text-ink-muted-foreground" : undefined}>
            {tier.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative flex flex-1 flex-col gap-6">
          <p
            ref={priceRef}
            className={cn(
              "font-display text-4xl font-semibold tabular-nums",
              tier.highlighted ? "text-ink-foreground text-5xl" : "text-foreground"
            )}
          >
            {formatPrice(tier.priceInPaise)}
          </p>
          <ul className="flex flex-col gap-2.5">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <Check
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    tier.highlighted ? "text-brand-teal" : "text-primary"
                  )}
                  aria-hidden="true"
                />
                <span className={tier.highlighted ? "text-ink-foreground/90" : "text-foreground"}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="relative">
          <Button
            variant={tier.highlighted ? "inverse" : "outline"}
            size="lg"
            asChild
            className="w-full"
          >
            <Link href="/contact?type=business">Get started</Link>
          </Button>
        </CardFooter>
      </Card>
    </Reveal>
  );
}

export interface PricingTiersProps {
  /** "teaser" (homepage, muted background, links out to /pricing) vs "full" (the dedicated page - see the same convention already used by CapabilitiesStrip/ServicesGrid). */
  variant?: "teaser" | "full";
}

function PricingTiers({ variant = "full" }: PricingTiersProps) {
  const isTeaser = variant === "teaser";

  return (
    <Section background={isTeaser ? "muted" : "default"}>
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-3">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
              Straightforward pricing
            </h2>
            <p className="text-muted-foreground max-w-md">
              Three fixed starting points, scoped further once we understand your project.
            </p>
          </div>
          {isTeaser && (
            <Button variant="outline" asChild className="shrink-0">
              <Link href="/pricing">See full pricing</Link>
            </Button>
          )}
        </div>

        <div className="grid gap-6 pt-2 lg:grid-cols-3 lg:items-start">
          {PRICING_TIERS.map((tier, index) => (
            <PricingCard key={tier.name} tier={tier} index={index} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { PricingTiers };
