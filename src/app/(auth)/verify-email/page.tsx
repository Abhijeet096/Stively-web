import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { consumeEmailVerificationToken } from "@/lib/auth-tokens";
import { ResendVerificationForm } from "@/components/forms/resend-verification-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * A Server Component calling consumeEmailVerificationToken directly rather
 * than a client form posting to a Server Action - visiting the link IS the
 * action here (the email contains a plain GET URL), so there's nothing to
 * submit.
 */
export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const userId = token ? await consumeEmailVerificationToken(token) : null;

  if (userId) {
    return (
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="text-success mb-2 size-10" aria-hidden="true" />
          <CardTitle className="font-display text-2xl">Email verified</CardTitle>
          <CardDescription>Your account is ready - you can sign in now.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="items-center text-center">
        <XCircle className="text-destructive mb-2 size-10" aria-hidden="true" />
        <CardTitle className="font-display text-2xl">Link invalid or expired</CardTitle>
        <CardDescription>Request a new verification email below.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResendVerificationForm />
      </CardContent>
    </Card>
  );
}
