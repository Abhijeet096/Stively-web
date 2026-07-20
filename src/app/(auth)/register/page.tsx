import type { Metadata } from "next";

import { RegisterForm } from "@/components/forms/register-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

interface RegisterPageProps {
  searchParams: Promise<{ type?: string; callbackUrl?: string }>;
}

/**
 * `?type=business` preselects the Business/Client toggle - the same query
 * convention /contact already uses (src/app/(marketing)/contact/page.tsx),
 * so a "Get started" link built for one works for the other without a
 * one-off param name.
 */
export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { type, callbackUrl } = await searchParams;
  const defaultRole = type === "business" ? "CLIENT" : "STUDENT";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Create your account</CardTitle>
        <CardDescription>Get started as a student or a business.</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm defaultRole={defaultRole} callbackUrl={callbackUrl} />
      </CardContent>
    </Card>
  );
}
