import { animate, createTimeline, createDrawable, type JSAnimation, type Timeline } from "animejs";

/**
 * Single source of truth for "should JS-driven motion run at all" - the
 * global `prefers-reduced-motion` rule in globals.css only fast-forwards
 * CSS transitions/animations, it has no effect on animejs's imperative
 * tweens. Every entry point below checks this first.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

/**
 * Draws the hero's decorative signal-path SVG once on load. The eyebrow/
 * heading/subheading/CTAs used to fade in via this same timeline (JS
 * setting opacity:0 on mount, then animejs tweening back to 1) - moved to a
 * pure CSS @keyframes animation (`hero-reveal` in globals.css, applied via
 * inline style directly in the SSR'd HTML) because hiding the hero heading
 * - almost always the page's LCP element - until this library hydrates and
 * runs measurably tanked Largest Contentful Paint on slower connections.
 * Only the signal path (decorative, aria-hidden, never an LCP candidate)
 * still needs real JS since its "drawn" progress isn't expressible as a
 * plain CSS keyframe. Reduced-motion: renders fully drawn immediately.
 */
export function playHeroLoadTimeline(root: HTMLElement): Timeline | null {
  const path = root.querySelector<SVGPathElement>("[data-signal-path]");
  if (!path) return null;

  if (prefersReducedMotion()) {
    createDrawable(path)[0]?.setAttribute("draw", "0 1");
    return null;
  }

  const timeline = createTimeline({ defaults: { ease: "outQuart" } });
  const [drawable] = createDrawable(path, 0, 0);
  timeline.add(drawable, { draw: ["0 0", "0 1"], duration: 700, ease: "inOutSine" }, 150);
  return timeline;
}

/**
 * Slow, looping ambient drift for background gradient orbs. Purely
 * decorative (aria-hidden elements only) - never applied to content.
 */
export function driftOrb(el: Element, distance = 26, duration = 9000): JSAnimation | null {
  if (prefersReducedMotion()) return null;
  return animate(el, {
    translateX: [0, distance, 0, -distance, 0],
    translateY: [0, -distance * 0.6, 0, distance * 0.6, 0],
    duration,
    loop: true,
    ease: "inOutSine",
  });
}

/**
 * Magnetic hover effect for exactly two CTAs site-wide (hero + final CTA).
 * Gated to fine-pointer devices and skipped under reduced motion; always
 * resets to zero offset on leave/blur so keyboard focus is never displaced.
 * Returns a cleanup function.
 */
export function attachMagnetic(el: HTMLElement, strength = 0.3): () => void {
  if (!isFinePointer() || prefersReducedMotion()) return () => {};

  const handleMove = (event: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    animate(el, { translateX: x * strength, translateY: y * strength, duration: 400, ease: "out(2)" });
  };
  const reset = () => {
    animate(el, { translateX: 0, translateY: 0, duration: 500, ease: "outElastic(1, .6)" });
  };

  el.addEventListener("pointermove", handleMove);
  el.addEventListener("pointerleave", reset);
  el.addEventListener("blur", reset);

  return () => {
    el.removeEventListener("pointermove", handleMove);
    el.removeEventListener("pointerleave", reset);
    el.removeEventListener("blur", reset);
  };
}

/**
 * Ties an SVG path's draw progress to scroll position within `container`
 * (BusinessProcess's literal appearance of the signal-path motif) - a
 * direct `getBoundingClientRect`-based progress calculation, rAF-throttled,
 * rather than animejs's `onScroll`/`ScrollObserver` (which proved unreliable
 * paired with `sync: true` against a plain container element in practice -
 * it never fired `onUpdate` regardless of scroll position). `createDrawable`
 * is still used for the underlying dasharray/dashoffset math, just driven
 * manually instead of through an animejs-managed autoplay. Reduced motion:
 * rendered fully drawn immediately - a scroll-progress-driven value would
 * otherwise stay stuck at 0% for these users, which the CSS
 * `prefers-reduced-motion` rule alone cannot fix since this value is
 * imperative, not a CSS animation/transition. Returns a cleanup function.
 */
export function linkPathDrawToScroll(path: SVGPathElement, container: Element): () => void {
  const [drawable] = createDrawable(path, 0, 0);
  if (prefersReducedMotion()) {
    drawable.setAttribute("draw", "0 1");
    return () => {};
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    // 0 when the container's top reaches the viewport's bottom edge (just
    // entering), 1 when its bottom reaches the viewport's top edge (about
    // to leave) - the same "enter"/"leave" thresholds the animejs approach
    // targeted, computed directly instead.
    const total = rect.height + viewportHeight;
    const traveled = viewportHeight - rect.top;
    const progress = Math.min(1, Math.max(0, total > 0 ? traveled / total : 0));
    drawable.setAttribute("draw", `0 ${progress}`);
  };
  const onScrollOrResize = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);

  return () => {
    window.removeEventListener("scroll", onScrollOrResize);
    window.removeEventListener("resize", onScrollOrResize);
  };
}

/**
 * Counts a price up from 0 to its real rupee value the first time `el`
 * scrolls into view, formatting every frame through the caller's own
 * `formatPrice` so currency formatting has exactly one implementation
 * site-wide. The real price is always the server-rendered `textContent`
 * already in the DOM - this only rewrites it client-side post-hydration,
 * so no-JS/pre-hydration/crawler output is never anything but the correct
 * final price. Observer disconnects after firing once, mirroring
 * `src/components/shared/reveal.tsx`'s own discipline, so scrolling back
 * up and down never replays the count.
 */
export function countUpPrice(
  el: HTMLElement,
  amountInPaise: number,
  formatPrice: (amountInPaise: number) => string
): () => void {
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    return () => {};
  }

  const finalRupees = amountInPaise / 100;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      const state = { rupees: 0 };
      animate(state, {
        rupees: finalRupees,
        duration: 900,
        ease: "outExpo",
        onUpdate: () => {
          el.textContent = formatPrice(Math.round(state.rupees) * 100);
        },
      });
      observer.disconnect();
    },
    { threshold: 0.4 }
  );
  observer.observe(el);

  return () => observer.disconnect();
}
