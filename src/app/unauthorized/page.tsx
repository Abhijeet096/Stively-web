import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/config/rbac";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Access denied",
  robots: { index: false, follow: false },
};

/**
 * The explanatory fallback for src/lib/session.ts's `requireRole` - the
 * common "wrong role clicked a stale link" case is handled silently and
 * faster by src/proxy.ts (redirects straight to ROLE_HOME), so landing
 * here specifically means a page's own defense-in-depth check caught
 * something the edge matcher didn't.
 */
export default async function UnauthorizedPage() {
  const session = await auth();
  const homeHref = session?.user ? ROLE_HOME[session.user.role] : "/login";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-primary font-mono text-xs font-semibold tracking-[0.14em] uppercase">
        403
      </p>
      <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">Access denied</h1>
      <p className="text-muted-foreground max-w-md">
        You don&apos;t have access to that page with your current account.
      </p>
      <Button asChild>
        <Link href={homeHref}>{session?.user ? "Back to your dashboard" : "Sign in"}</Link>
      </Button>
    </div>
  );
}
