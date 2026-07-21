"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SERVICES } from "@/lib/services-data";
import { driftOrb } from "@/lib/animations";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Button } from "@/components/ui/button";

const [FEATURED, ...REST] = SERVICES;

/**
 * A bento composition, not a duplicate of ServicesGrid - one larger
 * featured card (accent border, fuller copy) plus a supporting grid of the
 * remaining five, all reusing the same SERVICES data (single source of
 * truth) rather than a uniform N-equal-cards grid. Deliberately a
 * different visual template from WhyStivelyComparison above and
 * BusinessProcess below, so three sections in a row don't share one shape.
 */
function CapabilitiesStrip() {
  const orbRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const orb = orbRef.current ? driftOrb(orbRef.current, 18, 8000) : null;
    return () => {
      orb?.revert();
    };
  }, []);

  return (
    <Section background="default" className="texture-noise relative">
      <Container className="relative flex flex-col gap-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-3">
            <Eyebrow>Capabilities</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
              What we build
            </h2>
            <p className="text-muted-foreground max-w-md">
              Six capability areas, one engineering standard across all of them.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/services">See all services</Link>
          </Button>
        </div>

        <Reveal>
          <Link
            href="/services"
            className="group border-primary/40 bg-card focus-visible:ring-ring hover:shadow-glow relative flex flex-col gap-4 overflow-hidden rounded-xl border-2 p-6 shadow-xs transition-all duration-200 ease-out outline-none hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div
              ref={orbRef}
              aria-hidden="true"
              className="from-primary/8 pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-linear-to-br to-transparent blur-2xl"
            />
            <div className="relative flex items-start gap-4">
              <span className="from-primary/20 to-primary/5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                <FEATURED.icon className="text-primary size-6" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1.5">
                <span className="text-foreground text-xl font-semibold">{FEATURED.title}</span>
                <span className="text-muted-foreground max-w-lg text-sm">
                  {FEATURED.description}
                </span>
              </div>
            </div>
            <ArrowRight
              className="text-primary size-5 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REST.map((service, index) => (
            <Reveal key={service.title} delay={index * 60}>
              <div className="group border-border bg-card hover:border-primary/25 hover:shadow-glow flex h-full flex-col gap-3 rounded-lg border p-5 shadow-xs transition-all duration-200 ease-out hover:-translate-y-1">
                <span className="from-primary/15 to-primary/5 flex size-9 items-center justify-center rounded-lg bg-linear-to-br">
                  <service.icon className="text-primary size-4.5" aria-hidden="true" />
                </span>
                <span className="text-foreground text-sm font-medium">{service.title}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { CapabilitiesStrip };
