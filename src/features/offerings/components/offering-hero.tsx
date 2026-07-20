import type { Offering } from "@prisma/client";

import { formatPrice } from "@/lib/utils";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABEL, MODE_LABEL, DIFFICULTY_LABEL, formatOfferingPrice } from "../lib/labels";
import { OfferingCTA } from "./offering-cta";

/** Generic version of program-hero.tsx - every field reads off the record, nothing is Training-specific. */
function OfferingHero({ offering }: { offering: Offering }) {
  return (
    <Section
      id="offering-hero"
      background="inverted"
      className="texture-noise relative overflow-hidden py-20 md:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 900px 500px at 10% 0%, oklch(0.541 0.216 265.75 / 0.32), transparent 60%)," +
            "radial-gradient(ellipse 650px 450px at 90% 30%, oklch(0.746 0.127 200.01 / 0.18), transparent 55%)",
        }}
      />
      <Container className="relative flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="ink">{CATEGORY_LABEL[offering.category]}</Badge>
          <Badge variant="ink">{MODE_LABEL[offering.mode]}</Badge>
          {offering.difficulty && <Badge variant="ink">{DIFFICULTY_LABEL[offering.difficulty]}</Badge>}
          {offering.duration && <Badge variant="ink">{offering.duration}</Badge>}
          {offering.status === "COMING_SOON" && <Badge variant="ink">Coming soon</Badge>}
        </div>

        <h1 className="font-display text-4xl font-semibold tracking-[-0.025em] text-balance md:text-5xl">
          {offering.title}
        </h1>

        <p className="text-ink-muted-foreground max-w-2xl text-lg text-pretty">
          {offering.shortDescription}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <span className="text-ink-foreground font-display text-2xl font-semibold tabular-nums">
            {formatOfferingPrice(offering.price, offering.currency, offering.pricingType, formatPrice)}
          </span>
          <OfferingCTA offering={offering} primaryVariant="inverse" secondaryVariant="outline-inverse" />
        </div>
      </Container>
    </Section>
  );
}

export { OfferingHero };
