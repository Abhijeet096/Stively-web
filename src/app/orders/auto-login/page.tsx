import type { Metadata } from "next";

import { Logo } from "@/components/shared/logo";
import { AutoLoginForm } from "@/features/orders/components/auto-login-form";

interface AutoLoginPageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata: Metadata = {
  title: "Signing you in...",
  robots: { index: false, follow: false },
};

/**
 * The link in the guest-checkout welcome email (and the immediate
 * post-payment redirect target) - signs the buyer straight into their
 * brand-new account with no password, per the brief's "carry them straight
 * past the login wall into their new dashboard." No fields to fill; the
 * form auto-submits itself (see AutoLoginForm) the instant this page loads.
 */
export default async function AutoLoginPage({ searchParams }: AutoLoginPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo />
        <h1 className="font-display text-xl font-semibold">This link isn&apos;t valid</h1>
        <p className="text-muted-foreground max-w-sm text-sm">Double-check the link from your email, or sign in directly.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      <AutoLoginForm token={token} />
    </div>
  );
}
