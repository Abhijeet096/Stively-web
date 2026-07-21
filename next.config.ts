import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Everything here is static (no per-request nonce needed) so it lives in
 * config rather than src/proxy.ts - the CSP itself is the one header that
 * needs a fresh value per request and is set there instead. HSTS is
 * production-only: sending it over a plain `next dev` http:// origin would
 * make the browser remember "always HTTPS" for localhost, breaking local
 * dev until manually cleared from the browser's HSTS settings.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Superseded by CSP's frame-ancestors (set in src/proxy.ts) but kept
  // alongside it for browsers that don't honor frame-ancestors yet.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // same-origin (not same-site): nothing outside stively.com's exact origin
  // needs to load our resources cross-origin today.
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
