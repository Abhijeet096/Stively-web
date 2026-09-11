/**
 * Cheap, synchronous, zero-dependency checks - deliberately their own file
 * rather than living in lib/animations.ts (which statically imports the
 * full animejs library at module top-level). A caller that only needs to
 * decide WHETHER to animate at all - Magnetic's fine-pointer gate is the
 * one that matters here - can import just this file and skip ever fetching
 * animejs on a device where the answer is always no (touch, reduced
 * motion), instead of paying for the library and then no-op'ing inside it.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}
