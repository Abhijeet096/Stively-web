import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";

import { ClarityAnalytics } from "./clarity";

/**
 * Loads GA4 (via the official @next/third-parties component, which handles
 * gtag.js + App Router route-change pageviews itself - no manual dataLayer
 * wiring), Microsoft Clarity (via the official @microsoft/clarity SDK, see
 * clarity.tsx), and the Google Ads conversion tag (AW-...), all gated to
 * production builds only so `npm run dev` and preview testing never pollute
 * real analytics/ad data. `nonce` comes from src/proxy.ts's per-request CSP
 * nonce (read via `headers()` in the root layout) - production's strict
 * script-src has no 'unsafe-inline', so both the GA loader and the Ads
 * config script need it explicitly (Clarity's own script injection doesn't -
 * see clarity.tsx's comment on strict-dynamic).
 *
 * The Ads tag deliberately does NOT load its own gtag.js via a second
 * `https://www.googletagmanager.com/gtag/js?id=AW-...` script tag (which is
 * what Google's own "install manually" snippet shows, written for a site
 * with no existing gtag.js at all) - GoogleAnalytics above already loads
 * and initializes it for the G- property. `dataLayer.push`-based queuing
 * means a second `gtag('config', 'AW-...')` call safely reuses that same
 * instance regardless of script load order, so only the config call is
 * needed here, not a duplicate script load.
 */
export function Analytics({ nonce }: { nonce?: string }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <>
      {isProduction && gaId && <GoogleAnalytics gaId={gaId} nonce={nonce} />}
      {isProduction && clarityId && <ClarityAnalytics projectId={clarityId} />}
      {isProduction && googleAdsId && (
        <Script id="google-ads-config" strategy="afterInteractive" nonce={nonce}>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('config', '${googleAdsId}');
          `}
        </Script>
      )}
    </>
  );
}
