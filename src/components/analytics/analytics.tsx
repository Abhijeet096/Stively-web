import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";

/**
 * Loads GA4 (via the official @next/third-parties component, which handles
 * gtag.js + App Router route-change pageviews itself - no manual dataLayer
 * wiring) and Microsoft Clarity, both gated to production builds only so
 * `npm run dev` and preview testing never pollute real analytics data.
 * `nonce` comes from src/proxy.ts's per-request CSP nonce (read via
 * `headers()` in the root layout) - production's strict script-src has no
 * 'unsafe-inline', so both the GA loader and Clarity's inline bootstrap
 * script need it explicitly.
 */
export function Analytics({ nonce }: { nonce?: string }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <>
      {isProduction && gaId && <GoogleAnalytics gaId={gaId} nonce={nonce} />}

      {isProduction && clarityId && (
        <Script id="clarity-init" strategy="afterInteractive" nonce={nonce}>
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}
    </>
  );
}
