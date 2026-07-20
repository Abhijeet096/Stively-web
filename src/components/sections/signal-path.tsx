import * as React from "react";

import { cn } from "@/lib/utils";

export interface SignalPathProps {
  className?: string;
  /** The line's geometry for this instance - Hero, BusinessProcess, and the footer echo each pass their own. */
  d: string;
  viewBox: string;
  /**
   * "static" (the footer echo) renders a plain, fully-drawn line with no
   * dash setup - a quiet bookend, not more motion. The default (animated)
   * starts pre-hidden via the `pathLength`/`stroke-dasharray` trick so
   * `src/lib/animations.ts` (hero load timeline, scroll-linked draw) can
   * animate it with no flash of a fully-drawn line before JS hydrates.
   */
  animated?: boolean;
}

/**
 * The "signal path" motif: one gradient line (indigo -> iris -> teal)
 * appearing at three altitudes across the page - ambient in the hero,
 * literal as BusinessProcess's timeline connector, a quiet echo near the
 * footer. Purely decorative (aria-hidden) - never intercepts clicks.
 * Forwards a ref to the underlying <path> so callers that need to drive it
 * directly (BusinessProcess's scroll-linked draw, via
 * src/lib/animations.ts's linkPathDrawToScroll) can do so without relying
 * on the `data-signal-path` selector the hero load timeline uses instead.
 */
const SignalPath = React.forwardRef<SVGPathElement, SignalPathProps>(function SignalPath(
  { className, d, viewBox, animated = true },
  ref
) {
  const gradientId = React.useId();
  // `objectBoundingBox` (the gradient default) is degenerate - and silently
  // fails to render the stroke at all - when the path's own bounding box
  // has zero width, which a perfectly vertical line (BusinessProcess's
  // connector) always does. `userSpaceOnUse` spanning the viewBox's own
  // width sidesteps that entirely, for any path orientation.
  const [, , viewBoxWidth] = viewBox.split(/\s+/).map(Number);

  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      preserveAspectRatio="none"
      className={cn("pointer-events-none", className)}
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={0}
          x2={viewBoxWidth}
          y2={0}
        >
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="50%" stopColor="var(--brand-iris)" />
          <stop offset="100%" stopColor="var(--brand-teal)" />
        </linearGradient>
      </defs>
      <path
        ref={ref}
        {...(animated ? { "data-signal-path": "" } : {})}
        d={d}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={1.5}
        strokeLinecap="round"
        pathLength={animated ? 1 : undefined}
        // Plain attributes, not `style` - an inline `style` always wins over
        // presentation attributes in the CSS cascade, which would permanently
        // pin the path hidden regardless of what `createDrawable` (in
        // src/lib/animations.ts) writes afterwards via `setAttribute`. Using
        // the same mechanism (attributes) for both the initial SSR-safe
        // hidden state and every later update avoids that conflict entirely.
        strokeDasharray={animated ? 1 : undefined}
        strokeDashoffset={animated ? 1 : undefined}
      />
    </svg>
  );
});

export { SignalPath };
