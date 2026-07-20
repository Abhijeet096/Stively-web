import type { Offering } from "@prisma/client";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { OfferingCard } from "./offering-card";

function RelatedOfferings({ offerings }: { offerings: Offering[] }) {
  if (offerings.length === 0) return null;

  return (
    <Section background="default">
      <Container className="flex flex-col gap-8">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          Related offerings
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map((offering) => (
            <OfferingCard key={offering.id} offering={offering} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { RelatedOfferings };
