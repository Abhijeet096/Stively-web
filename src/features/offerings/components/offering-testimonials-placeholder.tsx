import { Quote } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/sections/empty-state";

/**
 * "Testimonials Placeholder" per the brief - deliberately not a real
 * Testimonial relation yet (see prisma/schema.prisma's Offering comment on
 * deferred future relations), and deliberately not fabricated review
 * content either - the codebase's existing anti-fabrication discipline
 * (see e.g. the Student dashboard's honest empty states) applies here too.
 */
function OfferingTestimonialsPlaceholder() {
  return (
    <Section background="muted">
      <Container className="flex flex-col items-center gap-8">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          What people are saying
        </h2>
        <EmptyState
          icon={Quote}
          title="Testimonials coming soon"
          description="We're collecting stories from people who've been through this offering - check back soon."
        />
      </Container>
    </Section>
  );
}

export { OfferingTestimonialsPlaceholder };
