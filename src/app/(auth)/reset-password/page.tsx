import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Token validity itself is checked by the resetPassword Server Action on
 * submit (src/actions/auth.ts), not here - this page only guards against
 * the link being missing entirely (no `?token=` at all), which is a
 * different, earlier failure than "expired."
 */
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="flex flex-col gap-3 text-center">
            <p className="text-muted-foreground text-sm">This link is missing its reset token.</p>
            <Link
              href="/forgot-password"
              className="text-primary text-sm font-medium underline-offset-4 hover:underline"
            >
              Request a new link
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
