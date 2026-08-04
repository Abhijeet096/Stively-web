import { GoogleAnalytics } from "@next/third-parties/google";

import { ClarityAnalytics } from "./clarity";

/**
 * Loads GA4 (via the official @next/third-parties component, which handles
 * gtag.js + App Router route-change pageviews itself - no manual dataLayer
 * wiring) and Microsoft Clarity (via the official @microsoft/clarity SDK,
 * see clarity.tsx), both gated to production builds only so `npm run dev`
 * and preview testing never pollute real analytics data. `nonce` comes from
 * src/proxy.ts's per-request CSP nonce (read via `headers()` in the root
 * layout) - production's strict script-src has no 'unsafe-inline', so the
 * GA loader needs it explicitly (Clarity's own script injection doesn't -
 * see clarity.tsx's comment on strict-dynamic).
 */
export function Analytics({ nonce }: { nonce?: string }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <>
      {isProduction && gaId && <GoogleAnalytics gaId={gaId} nonce={nonce} />}
      {isProduction && clarityId && <ClarityAnalytics projectId={clarityId} />}
    </>
  );
}
