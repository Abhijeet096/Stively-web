import Link from "next/link";
import type { Program } from "@prisma/client";

import { formatPrice } from "@/lib/utils";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Deliberately minimal - built only from fields that actually exist on
 * Program. A richer "what's included" list (certificate, mentor access,
 * etc., per the Phase E wireframe) was considered and left out: that
 * content doesn't exist anywhere in the schema, and fabricating marketing
 * copy not backed by real data isn't a reasonable substitute. Flagged in
 * the implementation plan as a schema/content gap, not silently invented.
 */
function ProgramPricingRecap({ program }: { program: Program }) {
  const enrollHref = `/signup?callbackUrl=/training/${program.slug}`;

  return (
    <Section background="default">
      <Container className="flex justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <span className="text-foreground font-display text-3xl font-semibold tabular-nums">
              {formatPrice(program.price, program.currency)}
            </span>
            <dl className="grid w-full grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="text-foreground font-medium">{program.durationWeeks} weeks</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Mode</dt>
                <dd className="text-foreground font-medium capitalize">
                  {program.mode.toLowerCase()}
                </dd>
              </div>
            </dl>
            <Button size="lg" asChild className="w-full">
              <Link href={enrollHref}>Enroll now</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}

export { ProgramPricingRecap };
