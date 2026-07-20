"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { attachMagnetic } from "@/lib/animations";

export interface MagneticProps {
  /** A single interactive child, typically a <Button> - grabbed via firstElementChild rather than a forwarded ref, since Button doesn't forward one. */
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

/**
 * Magnetic hover pull toward the pointer, used on exactly two CTAs
 * site-wide (hero primary + final CTASection primary) - see
 * `attachMagnetic` in src/lib/animations.ts for the reduced-motion /
 * fine-pointer-only / focus-safe guarantees. `display: contents` keeps this
 * wrapper invisible to layout, so it never affects the child's flex/inline
 * sizing in the surrounding CTA row.
 */
function Magnetic({ children, strength, className }: MagneticProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const target = wrapperRef.current?.firstElementChild;
    if (!(target instanceof HTMLElement)) return;
    return attachMagnetic(target, strength);
  }, [strength]);

  return (
    <div ref={wrapperRef} className={cn("contents", className)}>
      {children}
    </div>
  );
}

export { Magnetic };
