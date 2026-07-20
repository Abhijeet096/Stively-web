import "server-only";

import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { auth } from "@/lib/auth";

/**
 * Defense-in-depth for Server Components/layouts, on top of - not instead
 * of - src/proxy.ts's edge middleware. The middleware is the fast, real
 * gate every request passes through first; these helpers exist so a
 * misconfigured matcher or a future route added without updating
 * PROTECTED_ROUTES still can't expose a page's data, since the page itself
 * checks again before rendering.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/**
 * Redirects to the user's own dashboard (not a generic error) when their
 * role doesn't match - a wrong-role visit is a routing mistake, not
 * necessarily hostile, so landing them somewhere useful beats a dead end.
 */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}
