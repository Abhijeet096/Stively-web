import type { Testimonial } from "@prisma/client";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Static grid, not Home's carousel - Phase E is explicit these should differ
 * ("a single program has few enough testimonials that a grid reads better
 * than motion for motion's sake"). This is a separate component from Home's
 * Testimonials, not a variant of it, since the two have genuinely different
 * layout and interaction models.
 */
function ProgramTestimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <Section background="muted">
      <Container className="flex flex-col gap-8">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">What students say</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardContent className="flex flex-col gap-4">
                <p className="text-foreground text-sm">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="text-muted-foreground flex flex-col text-sm">
                  <span className="text-foreground font-medium">{testimonial.studentName}</span>
                  {testimonial.studentRole && <span>{testimonial.studentRole}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { ProgramTestimonials };
