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

interface ContentEventParams {
  contentName: string;
  /** Real order/offering amount in the currency's major unit - rupees, not paise. Omitted (not zeroed) when no price applies, so Meta doesn't record a false ₹0. */
  value?: number;
  currency?: string;
}

/**
 * Fires when a visitor actually views a product/course detail page - see
 * ViewContentTracker (features/offerings/components), the one call site,
 * mounted once per page load. Same safety check and same-shape params as
 * trackMetaPurchase/trackMetaInitiateCheckout below, kept as three small
 * functions rather than one generic `track(event, params)` so each call
 * site's intent stays obvious at the call, not just in its arguments.
 */
export function trackMetaViewContent({ contentName, value, currency }: ContentEventParams): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "ViewContent", {
    content_name: contentName,
    content_type: "product",
    ...(value != null && currency ? { value, currency } : {}),
  });
}

/**
 * Fires at the moment a Razorpay checkout attempt actually begins - right
 * before `razorpay.open()` in guest-checkout-form.tsx/checkout-button.tsx,
 * never on page load or on a raw button click that hasn't yet produced a
 * real order (a failed/already-owned createOrder response never reaches
 * this call). `value`/`currency` are the real order amount from that
 * response (base price + any add-on actually selected), same
 * paise->rupees conversion as trackMetaPurchase, not the offering's listed
 * price.
 */
export function trackMetaInitiateCheckout({ contentName, value, currency }: ContentEventParams): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "InitiateCheckout", {
    content_name: contentName,
    content_type: "product",
    ...(value != null && currency ? { value, currency } : {}),
  });
}
