"use client";

import * as React from "react";

import { START_PROJECT_CONVERSION_KEY } from "@/lib/conversion-tracking";

/**
 * Google Ads conversion action "Start Project Lead" (Contact category), on
 * the new AW-18357349291 account (replaces the AW-17718751960 one this
 * account superseded on 2026-08-11 - see NEXT_PUBLIC_GOOGLE_ADS_ID in .env/
 * .env.local). Conversion ID/label are fixed identifiers issued by Google
 * Ads for this exact conversion action - never regenerate or recompute
 * these, and never fire this event anywhere else without going through this
 * same component. "Page load" measurement, not "Click" - this event only
 * fires from real code on /thank-you after a genuinely successful
 * submission (see the component below), never tied to a button click, which
 * is what caused AD-011's original misconfiguration.
 */
const CONVERSION_LABEL = "AW-18357349291/-GutCJKL9t8cEKvXu7FE";
const CONVERSION_VALUE = 1.0;
const CONVERSION_CURRENCY = "INR";

/** How long to keep polling for `window.gtag` to exist before giving up and falling back to a raw dataLayer push. */
const GTAG_WAIT_TIMEOUT_MS = 5000;
const GTAG_POLL_INTERVAL_MS = 100;

/**
 * Mounted on /thank-you only (see that page). Fires the Google Ads
 * conversion event exactly once, and only when this exact tab's most
 * recent navigation here was the real result of a successful /start-project
 * submission (see conversion-tracking.ts's comment on why sessionStorage,
 * not a query param) - a direct visit to /thank-you (bookmarked, shared,
 * crawled, or just typed in) finds nothing to consume and fires nothing.
 *
 * Google Ads' own "automatically detect form submissions" feature was tried
 * first for this same conversion action and confirmed unreliable here: this
 * app's forms submit through React's Server Action mechanism
 * (`<form action={formAction}>`), which necessarily intercepts the native
 * submit event - Google's automatic detector reads that interception as
 * `gtm.formCanceled`, so it never linked a submission to reaching
 * /thank-you even though the funnel completed correctly every time. Firing
 * the event explicitly, from code, sidesteps that entirely.
 *
 * Calls the real `window.gtag(...)` function rather than pushing straight
 * to `dataLayer` - functionally the same once gtag.js has attached its own
 * `push` override to that array, but calling the actual function removes
 * any doubt about whether that's true yet, and matches Google's own
 * documented API surface exactly. Because GoogleAnalytics/the Ads config
 * script both load via next/script's `afterInteractive` strategy (async,
 * no ordering guarantee relative to this component's own mount), `window.
 * gtag` is not guaranteed to exist the instant this effect runs - fireWhenReady
 * polls for it (up to 5s) instead of assuming it's already there. Logs to
 * the console either way so this is provable from real devtools, not just
 * inferred - safe to leave in permanently, these are a handful of one-line
 * info/warn calls, not verbose debug spam.
 *
 * `firedRef` (not just "read-then-clear the sessionStorage key") is the
 * actual double-fire guard - React 19 Strict Mode intentionally
 * double-invokes effects in dev, and relying on sessionStorage alone would
 * still pass the first of those two invocations, since both run before
 * either one's cleanup. The ref persists across that within one mount, so
 * only the first invocation ever proceeds past it.
 */
export function StartProjectConversion() {
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (firedRef.current) return;
    if (process.env.NODE_ENV !== "production") return;

    let pending: string | null = null;
    try {
      pending = window.sessionStorage.getItem(START_PROJECT_CONVERSION_KEY);
      window.sessionStorage.removeItem(START_PROJECT_CONVERSION_KEY);
    } catch {
      return;
    }
    if (!pending) return;

    firedRef.current = true;

    let cancelled = false;
    const startedAt = Date.now();

    function fireWhenReady() {
      if (cancelled) return;

      if (typeof window.gtag === "function") {
        window.gtag("event", "conversion", { send_to: CONVERSION_LABEL, value: CONVERSION_VALUE, currency: CONVERSION_CURRENCY });
        console.info(
          `[stively-conversion] fired via window.gtag after ${Date.now() - startedAt}ms: ${CONVERSION_LABEL}`
        );
        return;
      }

      if (Date.now() - startedAt >= GTAG_WAIT_TIMEOUT_MS) {
        // window.gtag never became callable - queue the event directly on
        // dataLayer as a last resort (still correct if gtag.js loads later
        // and reads the array's backlog), and say so loudly, since this
        // path means something upstream (the base tag scripts) isn't
        // loading the way it's supposed to.
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(["event", "conversion", { send_to: CONVERSION_LABEL, value: CONVERSION_VALUE, currency: CONVERSION_CURRENCY }]);
        console.warn(
          `[stively-conversion] window.gtag never became available within ${GTAG_WAIT_TIMEOUT_MS}ms - used a raw dataLayer.push fallback for ${CONVERSION_LABEL}`
        );
        return;
      }

      setTimeout(fireWhenReady, GTAG_POLL_INTERVAL_MS);
    }

    fireWhenReady();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
