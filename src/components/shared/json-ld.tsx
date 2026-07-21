import { headers } from "next/headers";

/**
 * Async so every call site (9 of them, all Server Components) gets the CSP
 * nonce for free via `headers()` instead of threading a `nonce` prop through
 * each one - CSP has no type-based exemption for application/ld+json, so
 * this inline <script> is blocked in production without a matching nonce.
 */
async function JsonLd({ data }: { data: Record<string, unknown> }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // Browsers deliberately hide the `nonce` attribute from JS reads
      // after it's set (an anti-exfiltration measure) - reading it back
      // always returns "", which React's hydration check flags as a
      // mismatch even though the real nonce sent in the HTML is what CSP
      // actually validates against. Known React/CSP nonce caveat, not a
      // real bug: https://github.com/facebook/react/issues/24427
      suppressHydrationWarning
      // JSON-LD requires raw script injection - this is structured data we
      // construct ourselves (never user input), not a user-content XSS risk.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export { JsonLd };
