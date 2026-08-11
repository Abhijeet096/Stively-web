import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { resolveClientInviteToken, recordClientInviteOpen } from "@/features/sales-crm/server/invite-queries";
import { AcceptInviteForm } from "@/features/sales-crm/components/public/accept-invite-form";

interface ClientInviteTokenPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Set up your Stively account",
  robots: { index: false, follow: false },
};

function StatusScreen({ title, description, showSignIn }: { title: string; description: string; showSignIn?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="bg-muted flex size-14 items-center justify-center rounded-full">
        <AlertTriangle className="text-muted-foreground size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        <p className="text-muted-foreground max-w-sm text-sm text-pretty">{description}</p>
      </div>
      {showSignIn && (
        <Link href="/login" className="text-primary text-sm font-medium underline-offset-4 hover:underline">
          Sign in instead
        </Link>
      )}
    </div>
  );
}

/**
 * No auth, no dashboard shell - same "recipient isn't expected to have an
 * account yet" reasoning as /discovery/[token] and /proposal/[token]. This
 * is where they get one. Reuses the (auth) route group's exact card
 * treatment (Card/CardHeader/CardTitle/CardDescription) rather than
 * inventing a new visual language for one more auth-adjacent screen -
 * standalone route (not nested under (auth) itself) only because this page
 * needs its own token-resolution gate before the form ever renders.
 */
export default async function ClientInviteTokenPage({ params }: ClientInviteTokenPageProps) {
  const { token } = await params;
  const resolution = await resolveClientInviteToken(token);

  if (resolution.status === "not_found") {
    return <StatusScreen title="This link isn't valid" description="Double-check the link you were sent, or reach out to your Stively contact for a new one." />;
  }
  if (resolution.status === "expired") {
    return <StatusScreen title="This link has expired" description="Reach out to your Stively contact and we'll send you a fresh one." />;
  }
  if (resolution.status === "already_used") {
    return <StatusScreen title="This account is already set up" description="You've already created your account with this link." showSignIn />;
  }

  const { salesLead } = resolution;
  await recordClientInviteOpen(salesLead.id);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center gap-8 px-6 py-10">
      <Logo />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Set up your account</CardTitle>
          <CardDescription>
            {salesLead.businessName} - create a password to access your quotes, invoices, and project progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInviteForm token={token} email={salesLead.email ?? ""} businessName={salesLead.businessName} />
        </CardContent>
      </Card>
    </div>
  );
}
