import Link from "next/link";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";

/**
 * Deliberately the quietest, smallest section on the page - training still
 * exists and matters, but this is a business-first homepage now, and this
 * section's job is to explain where the talent in the sections above
 * actually comes from, not to re-pitch training as a co-equal offer. Kept
 * to a single paragraph rather than the previous program-card carousel,
 * per the explicit instruction that training should "support the business
 * story, not dominate it."
 */
function EcosystemNote() {
  return (
    <Section background="default" className="py-12 md:py-16">
      <Reveal>
        <Container className="mx-auto flex max-w-2xl flex-col gap-2 text-center">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Where the talent comes from
          </h2>
          <p className="text-muted-foreground text-pretty">
            Every developer on a Stively project trained and was evaluated inside our own programs
            first - that pipeline is also open to students who want the same real-project
            experience.{" "}
            <Link
              href="/training"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Explore training
            </Link>
          </p>
        </Container>
      </Reveal>
    </Section>
  );
}

export { EcosystemNote };
