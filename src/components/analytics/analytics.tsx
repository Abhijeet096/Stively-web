import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";

import { ClarityAnalytics } from "./clarity";

/**
 * Loads GA4 (via the official @next/third-parties component, which handles
 * gtag.js + App Router route-change pageviews itself - no manual dataLayer
 * wiring), Microsoft Clarity (via the official @microsoft/clarity SDK, see
 * clarity.tsx), the Google Ads conversion tag (AW-...), and the Meta/
 * Facebook Pixel base code, all gated to production builds only so
 * `npm run dev` and preview testing never pollute real analytics/ad data.
 * `nonce` comes from src/proxy.ts's per-request CSP nonce (read via
 * `headers()` in the root layout) - production's strict script-src has no
 * 'unsafe-inline', so the GA loader, the Ads config script, and the Pixel
 * bootstrap all need it explicitly (Clarity's own script injection
 * doesn't - see clarity.tsx's comment on strict-dynamic).
 *
 * The Ads tag deliberately does NOT load its own gtag.js via a second
 * `https://www.googletagmanager.com/gtag/js?id=AW-...` script tag (which is
 * what Google's own "install manually" snippet shows, written for a site
 * with no existing gtag.js at all) - GoogleAnalytics above already loads
 * and initializes it for the G- property. `dataLayer.push`-based queuing
 * means a second `gtag('config', 'AW-...')` call safely reuses that same
 * instance regardless of script load order, so only the config call is
 * needed here, not a duplicate script load.
 *
 * The Pixel is the base code + automatic PageView only - this component is
 * where it's installed once, sitewide, exactly as Meta's own "install the
 * base code in the header of every page" instruction asks for, using
 * Next.js's proper mechanism (next/script with a CSP nonce, not a raw
 * <script> tag) instead of a second, competing initialization anywhere
 * else. The Purchase event itself does NOT live here - see
 * src/lib/meta-pixel.ts's trackMetaPurchase, called only after a Razorpay
 * payment is actually verified server-side (guest-checkout-form.tsx).
 */
export function Analytics({ nonce }: { nonce?: string }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
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
      {isProduction && metaPixelId && (
        <>
          <Script id="meta-pixel-base" strategy="afterInteractive" nonce={nonce}>
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element -- Meta's own required noscript fallback, not a Next Image candidate */}
            <img
              height="1"
              width="1"
              alt=""
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
    </>
  );
}
