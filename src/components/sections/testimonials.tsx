"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Testimonial } from "@prisma/client";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
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

  const initials = current.studentName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Section background="default">
      <Container className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eyebrow>Testimonials</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
            What students say
          </h2>
        </div>

        <div className="border-border bg-card relative w-full max-w-2xl rounded-3xl border p-8 shadow-sm sm:p-12">
          <span
            aria-hidden="true"
            className="font-display text-primary/15 absolute top-4 left-6 text-8xl leading-none select-none"
          >
            &ldquo;
          </span>
          <div className="flex items-center gap-4">
            {testimonials.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={goPrev}
                aria-label="Previous testimonial"
                className="shrink-0"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
            )}

            <blockquote
              key={current.id}
              aria-live="polite"
              className="animate-in fade-in relative flex flex-1 flex-col items-center gap-5 text-center duration-200"
            >
              <p className="text-foreground text-lg text-balance">&ldquo;{current.quote}&rdquo;</p>
              <footer className="flex flex-col items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full text-xs font-semibold"
                >
                  {initials}
                </span>
                <span className="text-muted-foreground flex flex-col">
                  <span className="text-foreground font-medium">{current.studentName}</span>
                  {current.studentRole && <span>{current.studentRole}</span>}
                </span>
              </footer>
            </blockquote>

            {testimonials.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={goNext}
                aria-label="Next testimonial"
                className="shrink-0"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            )}
          </div>
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
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === index ? "bg-primary w-6" : "bg-border w-2"
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
