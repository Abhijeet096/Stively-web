import type { Testimonial } from "@prisma/client";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Reveal } from "@/components/shared/reveal";
import { Card, CardContent } from "@/components/ui/card";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <Eyebrow>Testimonials</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            What students say
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.id} delay={index * 60} className="h-full">
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-5">
                  <span
                    aria-hidden="true"
                    className="font-display text-primary/20 text-5xl leading-none select-none"
                  >
                    &ldquo;
                  </span>
                  <p className="text-foreground -mt-6 flex-1 text-sm text-pretty">
                    {testimonial.quote}
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    >
                      {initialsOf(testimonial.studentName)}
                    </span>
                    <div className="text-muted-foreground flex flex-col text-sm">
                      <span className="text-foreground font-medium">
                        {testimonial.studentName}
                      </span>
                      {testimonial.studentRole && <span>{testimonial.studentRole}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { ProgramTestimonials };
