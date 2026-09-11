"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { prefersReducedMotion, isFinePointer } from "@/lib/motion-guards";

export interface MagneticProps {
  /** A single interactive child, typically a <Button> - grabbed via firstElementChild rather than a forwarded ref, since Button doesn't forward one. */
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

/**
 * Magnetic hover pull toward the pointer, used on exactly two CTAs
 * site-wide (hero primary + final CTASection primary) - see
 * `attachMagnetic` in src/lib/animations.ts for the focus-safe reset
 * guarantee. `display: contents` keeps this wrapper invisible to layout, so
 * it never affects the child's flex/inline sizing in the surrounding CTA
 * row.
 *
 * The fine-pointer/reduced-motion checks run here, BEFORE importing
 * lib/animations.ts, not inside attachMagnetic - a touch device or a
 * reduced-motion user never has any reason to run this effect, so gating
 * first means they never fetch the animejs chunk at all, rather than
 * downloading and parsing it only to have attachMagnetic immediately no-op.
 * This is the one animejs call site actually worth skipping outright; every
 * other one (hero load, scroll-linked paths, price count-up) is a real
 * feature on every device and only needs to move off the critical path,
 * not be skipped - see their own dynamic-import comments.
 */
function Magnetic({ children, strength, className }: MagneticProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const target = wrapperRef.current?.firstElementChild;
    if (!(target instanceof HTMLElement)) return;
    if (!isFinePointer() || prefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    import("@/lib/animations").then(({ attachMagnetic }) => {
      if (cancelled) return;
      cleanup = attachMagnetic(target, strength);
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [strength]);

  return (
    <div ref={wrapperRef} className={cn("contents", className)}>
      {children}
    </div>
  );
}

export { Magnetic };
