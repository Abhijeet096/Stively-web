import Link from "next/link";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Magnetic } from "@/components/shared/magnetic-button";
import { SignalPath } from "@/components/sections/signal-path";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CTASectionProps {
  heading: string;
  description?: string;
  actionLabel: string;
  actionHref: string;
  /** Inverted background reads as a page anchor point - use on at most one CTA per page (see design-system.md §18) */
  inverted?: boolean;
  /**
   * Adds a subtle radial accent glow behind the heading on inverted CTAs -
   * an optional, additive treatment, off by default so every existing
   * caller is unchanged. Also the signal for "this is the page's climactic
   * CTA": when true, the primary button gets the magnetic hover effect
   * (the 2nd and last use of it site-wide, alongside the Hero's) and a
   * small static signal-path echo appears near the heading - a quiet
   * bookend to the motif the Hero introduces, not more motion.
   */
  glow?: boolean;
}

function CTASection({
  heading,
  description,
  actionLabel,
  actionHref,
  inverted = false,
  glow = false,
}: CTASectionProps) {
  const button = (
    <Button size="lg" variant={inverted ? "inverse" : "primary"} asChild>
      <Link href={actionHref}>{actionLabel}</Link>
    </Button>
  );

  return (
    <Section
      background={inverted ? "inverted" : "muted"}
      className={cn("relative overflow-hidden", inverted && "texture-noise")}
    >
      {glow && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 900px 500px at 30% 0%, oklch(0.541 0.216 265.75 / 0.4), transparent 65%)," +
                "radial-gradient(ellipse 600px 420px at 55% 15%, oklch(0.66 0.17 232.9 / 0.22), transparent 60%)," +
                "radial-gradient(ellipse 700px 480px at 80% 100%, oklch(0.746 0.127 200.01 / 0.22), transparent 65%)",
            }}
          />
          <div
            aria-hidden="true"
            className="text-ink-foreground/[0.05] bg-dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_20%,black,transparent)]"
          />
        </>
      )}
      <Container className="relative flex flex-col items-center gap-6 text-center">
        {glow && (
          <SignalPath
            animated={false}
            d="M4 16 C 60 2, 120 24, 176 10"
            viewBox="0 0 180 24"
            className="h-4 w-32 opacity-60"
          />
        )}
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          {heading}
        </h2>
        {description && (
          <p
            className={
              inverted
                ? "text-ink-muted-foreground max-w-2xl text-lg text-pretty"
                : "text-muted-foreground max-w-2xl text-lg text-pretty"
            }
          >
            {description}
          </p>
        )}
        {glow ? <Magnetic>{button}</Magnetic> : button}
      </Container>
    </Section>
  );
}

export { CTASection };
