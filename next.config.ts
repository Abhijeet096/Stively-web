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
  // Default is 1MB - the interview integrity system's webcam recording
  // upload (src/features/interviews/actions/integrity-actions.ts) needs
  // real headroom: ~1.74MB/min at the configured MediaRecorder bitrate,
  // so a default 20min interview is ~35MB. 60mb covers that comfortably
  // with room for multipart overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: "60mb",
    },
  },
  // The digital-store download route reads its PDF from private/ via a path
  // built at runtime from Offering.digitalAssetPath (a DB value, not a
  // string literal) - Next's build-time file tracer can't follow that, so
  // without this the file silently wouldn't ship in the deployed function
  // bundle even though `next dev` (which has the whole repo on disk) works
  // fine. Same class of gap as the invoice PDF's Cloudinary "restricted
  // media types" issue (see ROADMAP.md) - a download that works locally but
  // 404s in production - fixed at the source this time, not discovered later.
  outputFileTracingIncludes: {
    // Brackets are picomatch character-class syntax, not literal route
    // syntax - escaped so this actually matches the [token] dynamic
    // segment instead of a single literal char from the set {t,o,k,e,n}.
    "/api/digital-store/download/\\[token\\]": ["./private/digital-products/**/*"],
  },
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
      // The AI interview flow needs the candidate's own camera/microphone -
      // scoped to this one path (not site-wide) so every other page keeps
      // the fully-denied default above. Later entries override earlier ones
      // for the same header on a matching path (see Next's headers() docs).
      {
        source: "/interview/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(), browsing-topics=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
  // The blog moved off this domain to blog.stively.com - every legacy
  // /blog and /blog/<slug> URL on this domain now permanently (301) redirects
  // to the identical path there, rather than 404ing. `:slug*` (zero-or-more)
  // covers both the bare /blog index and every nested post URL in one rule.
  // `statusCode: 301` is used explicitly instead of `permanent: true`
  // (which emits 308 in this Next.js version) to match a literal 301.
  async redirects() {
    return [
      {
        source: "/blog/:slug*",
        destination: "https://blog.stively.com/blog/:slug*",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
