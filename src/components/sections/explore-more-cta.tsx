import Link from "next/link";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

/**
 * Not CTASection - that component is one heading, one action, by design,
 * and shared across five other pages already. This page needs three
 * actions (Training / Services / Contact), which is a genuinely different
 * shape, not a style variant - built separately rather than widening
 * CTASection's contract for every existing caller.
 */
function ExploreMoreCta() {
  return (
    <Section background="inverted">
      <Container className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Where to go next</h2>
          <p className="text-background/70 max-w-xl">
            Whether you&apos;re here to learn, to hire, or just to ask a question - there&apos;s a
            next step either way.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/training">Explore Training</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/services">Explore Services</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export { ExploreMoreCta };
