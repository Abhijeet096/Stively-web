import { Check } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import type { SectionProps } from "@/components/shared/section";

export interface OfferingListSectionProps {
  title: string;
  items: string[];
  background?: SectionProps["background"];
}

/**
 * ONE generic {title, items[]} block, reused for What You'll Learn,
 * Benefits, Who It's For, and Requirements - not four near-identical
 * components. Same checklist visual as program-outcomes.tsx. Omits itself
 * when empty, same "don't half-render a section with nothing in it" rule
 * every other Program/Offering section already follows.
 */
function OfferingListSection({ title, items, background = "muted" }: OfferingListSectionProps) {
  if (items.length === 0) return null;

  return (
    <Section background={background}>
      <Container className="flex flex-col gap-8">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          {title}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-foreground text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export { OfferingListSection };
