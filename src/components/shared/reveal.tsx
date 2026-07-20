"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stagger successive Reveals in a group by passing increasing values (ms). */
  delay?: number;
}

/**
 * One small, reusable scroll-entrance wrapper - not per-element stagger
 * spam. Wraps a section's inner content (not the <Section> itself, which
 * stays a Server Component); this is the only "use client" boundary it
 * introduces. Starts visible-by-default in the DOM (opacity is the only
 * thing that changes, never `display`/`visibility`), so content is never
 * hidden from crawlers or screen readers - only the transition is deferred
 * until the element scrolls into view. `prefers-reduced-motion` is handled
 * globally already (globals.css collapses all transition-duration to
 * ~0 for that media query), so no extra logic is needed here for it.
 */
function Reveal({ delay = 0, className, style, children, ...props }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  // Always starts hidden, on both server and client, so hydration never has
  // to reconcile a mismatch. A previous version used a lazy initializer
  // (`typeof IntersectionObserver === "undefined"`) to start pre-visible in
  // environments without it - but that check runs during render, so it's
  // exactly the "server/client branch" React's hydration-mismatch warning
  // calls out: SSR (Node) has no IntersectionObserver, but every real
  // browser does, so server and client disagreed on the very first paint.
  // The environment check now lives in the effect below instead, where a
  // server/client branch belongs.
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      // Deferred a tick (rather than called synchronously in the effect
      // body) per react-hooks/set-state-in-effect - this is the rare
      // fallback path (no IntersectionObserver support), not the normal one.
      queueMicrotask(() => setVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms", ...style }}
      className={cn(
        "transition-all duration-500 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Reveal };
