"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Testimonial } from "@prisma/client";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export interface TestimonialsProps {
  testimonials: Testimonial[];
}

/**
 * Single testimonial at a time on every breakpoint (per Phase E: "always
 * single-card on mobile, already true on desktop-adjacent breakpoints").
 * Manually controlled only - no autoplay. Phase E's wireframe mentioned
 * autoplay pausing on hover/focus, but autoplaying carousels are a well-known
 * accessibility and attention-cost problem; dropping autoplay entirely is a
 * deliberate, accessibility-positive simplification, not an oversight.
 */
function Testimonials({ testimonials }: TestimonialsProps) {
  const [index, setIndex] = React.useState(0);

  if (testimonials.length === 0) return null;

  const current = testimonials[index];
  const goPrev = () => setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  return (
    <Section background="default">
      <Container className="flex flex-col items-center gap-8">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">What students say</h2>

        <div className="flex w-full max-w-2xl items-center gap-4">
          {testimonials.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              aria-label="Previous testimonial"
              className="shrink-0"
            >
              <ChevronLeft />
            </Button>
          )}

          <blockquote
            key={current.id}
            aria-live="polite"
            className="flex flex-1 flex-col items-center gap-4 text-center"
          >
            <p className="text-foreground text-lg">&ldquo;{current.quote}&rdquo;</p>
            <footer className="text-muted-foreground flex flex-col text-sm">
              <span className="text-foreground font-medium">{current.studentName}</span>
              {current.studentRole && <span>{current.studentRole}</span>}
            </footer>
          </blockquote>

          {testimonials.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goNext}
              aria-label="Next testimonial"
              className="shrink-0"
            >
              <ChevronRight />
            </Button>
          )}
        </div>

        {testimonials.length > 1 && (
          <div className="flex gap-2" role="tablist" aria-label="Choose testimonial">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`Testimonial from ${t.studentName}`}
                onClick={() => setIndex(i)}
                className={`size-2 rounded-full transition-colors duration-150 ${
                  i === index ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

export { Testimonials };
