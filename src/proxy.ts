import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Route protection for authenticated areas. Runs before any /dashboard
 * page exists yet - so once Step 5 builds those pages, access control
 * is already in place rather than being bolted on afterward.
 *
 * Named `proxy` (not `middleware`) per the Next.js 16 convention - the
 * file itself was also renamed from middleware.ts. The proxy runtime is
 * always nodejs (edge is no longer an option here), which works in our
 * favor: Auth.js's database session strategy goes through Prisma, which
 * needs the nodejs runtime anyway.
 */
export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
