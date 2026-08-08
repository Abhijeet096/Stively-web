"use client";

import * as React from "react";

import { START_PROJECT_CONVERSION_KEY } from "@/lib/conversion-tracking";

/**
 * Google Ads conversion action "Start Project Lead" (Contact category).
 * Conversion ID/label are fixed identifiers issued by Google Ads for this
 * exact conversion action - never regenerate or recompute these, and never
 * fire this event anywhere else without going through this same component.
 */
const CONVERSION_LABEL = "AW-17718751960/4kRyCOyJ3t0cENjl-oBC";

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

    // window.dataLayer's type (Object[] | undefined) is already declared
    // globally by @next/third-parties (used by GoogleAnalytics in
    // analytics.tsx) - no need to redeclare it here.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(["event", "conversion", { send_to: CONVERSION_LABEL }]);
  }, []);

  return null;
}
