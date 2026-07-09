import Link from "next/link";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export interface HeroCta {
  label: string;
  href: string;
}

export interface HeroSectionProps {
  eyebrow?: string;
  heading: string;
  subheading: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
}

/**
 * Reusable across marketing pages (Home now, About/Training later per
 * Phase E) - not Home-specific content baked in. Fades in once on load
 * (200ms, no per-word stagger) per design-system.md §6/§7's rule against
 * page-load animation spectacle.
 */
function HeroSection({ eyebrow, heading, subheading, primaryCta, secondaryCta }: HeroSectionProps) {
  return (
    <Section background="default" className="animate-in fade-in py-20 duration-200 md:py-28">
      <Container className="flex flex-col items-center gap-6 text-center">
        {eyebrow && (
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
          {heading}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">{subheading}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          {secondaryCta && (
            <Button size="lg" variant="ghost" asChild className="w-full sm:w-auto">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          )}
        </div>
      </Container>
    </Section>
  );
}

export { HeroSection };
