import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { findProtectedRoute, ROLE_HOME, GUEST_ONLY_ROUTES } from "@/config/rbac";

/**
 * The real route guard that src/proxy.ts's previous version explicitly
 * flagged as "A REAL, CURRENT SECURITY GAP" while disabled - now live.
 * Runs at the edge via Auth.js's `auth()` wrapper, which decodes the JWT
 * session cookie locally (no Prisma call - see src/lib/auth.ts's session
 * strategy comment for why that matters here).
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

  const isGuestOnlyRoute = GUEST_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isGuestOnlyRoute && role) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], req.nextUrl.origin));
  }

  const protectedRoute = findProtectedRoute(pathname);
  if (!protectedRoute) {
    return NextResponse.next();
  }

  if (!role) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!protectedRoute.roles.includes(role)) {
    // Wrong role, not unauthenticated - bounce straight to where they
    // actually belong rather than an error page (see src/lib/session.ts's
    // requireRole for the slower, explanatory fallback used when a page's
    // own defense-in-depth check catches something this matcher didn't).
    return NextResponse.redirect(new URL(ROLE_HOME[role], req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/student/:path*",
    "/mentor/:path*",
    "/client/:path*",
    "/company/:path*",
    "/intern/:path*",
    "/team/:path*",
    "/admin/:path*",
    "/ceo/:path*",
    "/login",
    "/register",
  ],
};
