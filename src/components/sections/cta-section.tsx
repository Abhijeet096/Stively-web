import Link from "next/link";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export interface CTASectionProps {
  heading: string;
  description?: string;
  actionLabel: string;
  actionHref: string;
  /** Inverted background reads as a page anchor point - use on at most one CTA per page (see design-system.md §18) */
  inverted?: boolean;
}

function CTASection({
  heading,
  description,
  actionLabel,
  actionHref,
  inverted = false,
}: CTASectionProps) {
  return (
    <Section background={inverted ? "inverted" : "muted"}>
      <Container className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          {heading}
        </h2>
        {description && (
          <p
            className={
              inverted
                ? "text-background/70 max-w-2xl text-lg"
                : "text-muted-foreground max-w-2xl text-lg"
            }
          >
            {description}
          </p>
        )}
        <Button size="lg" variant={inverted ? "secondary" : "primary"} asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </Container>
    </Section>
  );
}

export { CTASection };
