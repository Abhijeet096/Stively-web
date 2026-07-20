import type { Metadata } from "next";

import { LoginForm } from "@/components/forms/login-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

/**
 * The one login page every role signs in from - "no separate admin login
 * page," per the brief. What happens after a successful sign-in (which
 * role-home path a visitor lands on) is proxy.ts + src/config/rbac.ts's
 * job, not this page's.
 */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email already has a password-based account. Sign in with your password instead.",
  AccessDenied: "That sign-in was cancelled or denied.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, error } = await searchParams;
  const oauthError = error ? (OAUTH_ERROR_MESSAGES[error] ?? "Something went wrong signing in.") : undefined;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Stively account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {oauthError && (
          <p role="alert" className="text-destructive text-sm">
            {oauthError}
          </p>
        )}
        <LoginForm callbackUrl={callbackUrl} />
      </CardContent>
    </Card>
  );
}
