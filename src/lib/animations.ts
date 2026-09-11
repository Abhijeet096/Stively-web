// This file statically imports the full animejs library - every caller
// pulls that ~30-40KB in as part of whatever chunk it lands in. Import it
// dynamically (`await import("@/lib/animations")` inside the effect that
// needs it, not a top-level `import ... from`) rather than adding a new
// static import here, so animejs stays off the initial/critical bundle for
// every page. See every existing call site (hero-section.tsx,
// capabilities-strip.tsx, pricing-tiers.tsx, process-timeline.tsx,
// process-stage-detail.tsx, magnetic-button.tsx) for the pattern - and
// magnetic-button.tsx specifically for how to skip the import entirely
// when the guards below already say no.
import { animate, createTimeline, createDrawable, type JSAnimation, type Timeline } from "animejs";
import { prefersReducedMotion, isFinePointer } from "./motion-guards";

// Re-exported (not defined here) so an existing importer of
// prefersReducedMotion from this file keeps working unchanged. A caller
// that only needs the guard - not the animejs-dependent functions below -
// should import lib/motion-guards.ts directly instead, so it never pulls
// animejs in at all. Every entry point below still checks
// prefersReducedMotion first, same as before this split.
export { prefersReducedMotion, isFinePointer };

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
 *
 * `loop: true` has no end condition, so once started this runs forever -
 * not lifecycle-aware on its own. Exported mainly for observeDriftOrb below
 * to build on; a caller rendering one of these orbs should use that instead
 * of calling this directly, so the animation actually stops costing
 * anything while its element is off-screen.
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
 * Lifecycle-aware version of driftOrb - the three ambient orbs that use it
 * (Hero's aurora, CapabilitiesStrip's, ProcessTimeline/ProcessStageDetail's)
 * were each running driftOrb's infinite loop unconditionally for as long as
 * the component stayed mounted, including while scrolled completely out of
 * view. Confirmed via animejs's own engine source (engine.js): a `.pause()`d
 * timer is removed from the engine's active list on its next tick, and once
 * nothing is left active the engine stops scheduling `requestAnimationFrame`
 * entirely - so pausing every visible orb genuinely stops the work, it
 * doesn't just skip rendering while still ticking.
 *
 * Exactly one JSAnimation instance is created per call (on first
 * intersection, not eagerly at mount) and every later enter/leave toggles
 * `.resume()`/`.pause()` on that SAME instance - never a second one - so
 * resuming continues the drift from where it paused rather than restarting
 * it, and there's never more than one loop per element. `rootMargin` starts
 * the drift a little before the orb is actually on-screen (and stops it a
 * little after) so a fast scroll never catches it visibly kicking off
 * mid-viewport.
 *
 * Skips creating the IntersectionObserver entirely under reduced motion or
 * if IntersectionObserver isn't available, matching driftOrb's own no-op
 * there - nothing to observe if it's never going to animate.
 *
 * Returns a single cleanup function: disconnects the observer and reverts
 * the animation. Call it on unmount.
 */
export function observeDriftOrb(el: Element, distance = 26, duration = 9000): () => void {
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    return () => {};
  }

  let anim: JSAnimation | null = null;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (anim) {
          anim.resume();
        } else {
          anim = driftOrb(el, distance, duration);
        }
      } else {
        anim?.pause();
      }
    },
    { rootMargin: "150px 0px" }
  );
  observer.observe(el);

  return () => {
    observer.disconnect();
    anim?.revert();
  };
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
