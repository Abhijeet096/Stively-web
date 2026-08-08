import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { findProtectedRoute, ROLE_HOME, GUEST_ONLY_ROUTES } from "@/config/rbac";

/**
 * Builds this request's Content-Security-Policy. script-src is nonce +
 * strict-dynamic only (no 'unsafe-inline'/'unsafe-eval' in production) -
 * every inline script in the app (next-themes' FOUC-prevention script,
 * JSON-LD blocks, GA/Clarity/Razorpay loaders) is threaded this nonce
 * explicitly rather than relying on a blanket script allowance. style-src
 * keeps 'unsafe-inline' because CSP has no nonce mechanism for the
 * `style="..."` attribute itself (only for <style> elements), and this app
 * legitimately renders inline `style` props (animation delays, Radix
 * Popper positioning, gradient backgrounds) into SSR'd HTML. frame-src and
 * media-src stay broad (https:) because BlockEmbed/BlockVideo are a
 * deliberate "embed any third-party lesson content" escape hatch, not a
 * fixed provider allowlist.
 *
 * `www.google.com`/`www.google.co.in`/`ad.doubleclick.net` in img-src and
 * connect-src are the Google Ads conversion tag's own telemetry beacons
 * (rmkt/collect, ccm/collect, pagead/1p-user-list) - confirmed by a real
 * browser test that gtag('config', 'AW-...') itself fires fine without
 * them, but every actual data-collection request it sends gets silently
 * CSP-blocked, meaning conversion tracking would report zero data despite
 * the tag technically being "installed." Google doesn't publish one fixed
 * hostname for this - which regional google.<tld> a given visitor's beacon
 * lands on varies, .co.in is the one confirmed for this site's target
 * market. `www.googleadservices.com`/`googleads.g.doubleclick.net` are a
 * separate pair, specific to explicit `gtag('event', 'conversion', ...)`
 * calls (as opposed to the config/remarketing pings above) - confirmed by a
 * real live production submission whose devtools console showed the exact
 * blocked-by-CSP fetch/image requests to both, with the correct conversion
 * label already attached, proving the JS call itself was firing correctly
 * the whole time and this was the only remaining gap.
 */
function buildCsp(nonce: string, isDev: boolean) {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https://res.cloudinary.com https://www.googletagmanager.com https://www.google.com https://www.google.co.in https://www.googleadservices.com https://googleads.g.doubleclick.net`,
    `font-src 'self' data:`,
    `connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://www.google.com https://www.google.co.in https://ad.doubleclick.net https://www.googleadservices.com https://googleads.g.doubleclick.net https://api.razorpay.com https://lumberjack.razorpay.com${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
    `frame-src 'self' https:`,
    `media-src 'self' https:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self'`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

/**
 * The real route guard that src/proxy.ts's previous version explicitly
 * flagged as "A REAL, CURRENT SECURITY GAP" while disabled - now live.
 * Runs at the edge via Auth.js's `auth()` wrapper, which decodes the JWT
 * session cookie locally (no Prisma call - see src/lib/auth.ts's session
 * strategy comment for why that matters here). Also the one place that can
 * generate a fresh per-request CSP nonce and get it onto both the request
 * (so Server Components can read it via `headers()`) and the response.
 *
 * Every protected prefix and who may enter it lives in src/config/rbac.ts,
 * not here - this file only enforces that map, so a new portal never needs
 * a change to this logic, just one more entry in rbac.ts plus a route
 * folder.
 */
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const next = () => withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  function withCsp(response: NextResponse) {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  const isGuestOnlyRoute = GUEST_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isGuestOnlyRoute && role) {
    return withCsp(NextResponse.redirect(new URL(ROLE_HOME[role], req.nextUrl.origin)));
  }

  const protectedRoute = findProtectedRoute(pathname);
  if (!protectedRoute) {
    return next();
  }

  if (!role) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withCsp(NextResponse.redirect(loginUrl));
  }

  if (!protectedRoute.roles.includes(role)) {
    // Wrong role, not unauthenticated - bounce straight to where they
    // actually belong rather than an error page (see src/lib/session.ts's
    // requireRole for the slower, explanatory fallback used when a page's
    // own defense-in-depth check catches something this matcher didn't).
    return withCsp(NextResponse.redirect(new URL(ROLE_HOME[role], req.nextUrl.origin)));
  }

  return next();
});

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|icon|apple-icon|opengraph-image).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
