/**
 * Shared `window.fbq` typing and the one function that ever calls it for a
 * Purchase - same reasoning as razorpay-client-types.ts's shared
 * `window.Razorpay` declaration (one `declare global`, not redeclared per
 * caller).
 */
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires the Meta Pixel Purchase event - the ONLY place in the app that
 * calls `fbq('track', 'Purchase', ...)`, so every caller goes through the
 * same safety check instead of duplicating it. Silently no-ops rather than
 * throwing when `fbq` doesn't exist yet: an ad blocker, a dev environment
 * with no NEXT_PUBLIC_META_PIXEL_ID set, or the base script (see
 * src/components/analytics/analytics.tsx) not having loaded yet are all
 * real, expected states, not errors.
 *
 * `value` must be the real, server-verified amount actually charged for
 * this specific transaction (in the currency's major unit - rupees, not
 * paise), read from the backend's verified response - never a hardcoded
 * price, so an order that included a paid add-on reports what was
 * genuinely paid, not just the course's base price.
 */
export function trackMetaPurchase(value: number, currency: string): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "Purchase", { value, currency });
}
