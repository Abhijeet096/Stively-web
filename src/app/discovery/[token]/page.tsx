import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";
import { resolveDiscoveryFormToken, recordDiscoveryFormOpen } from "@/features/discovery-forms/server/token-queries";
import { submitDiscoveryFormByToken } from "@/features/discovery-forms/actions/discovery-form-actions";
import { DiscoveryFormFields } from "@/features/discovery-forms/components/discovery-form-fields";

interface DiscoveryFormTokenPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Project Discovery & Requirements Form",
  robots: { index: false, follow: false },
};

function StatusScreen({ title, description }: { title: string; description: string }) {
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
    </div>
  );
}

/** No auth, no dashboard shell - same "recipient is never expected to have an account" reasoning as the public /proposal/[token] page. */
export default async function DiscoveryFormTokenPage({ params }: DiscoveryFormTokenPageProps) {
  const { token } = await params;
  const resolution = await resolveDiscoveryFormToken(token);

  if (resolution.status === "not_found") {
    return <StatusScreen title="This link isn't valid" description="Double-check the link you were sent, or reach out to your Stively contact for a new one." />;
  }
  if (resolution.status === "expired") {
    return <StatusScreen title="This link has expired" description="Reach out to your Stively contact and we'll send you a fresh one." />;
  }
  if (resolution.status === "already_submitted") {
    return <StatusScreen title="This form has already been submitted" description="Thanks - your requirements are already with our team." />;
  }

  await recordDiscoveryFormOpen(resolution.form.id);

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border border-b py-4">
        <Container size="narrow">
          <Logo />
        </Container>
      </header>

      <Container size="narrow" className="flex flex-col gap-6 py-10 sm:py-14">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Project Discovery & Requirements Form
          </h1>
          <p className="text-muted-foreground text-sm text-pretty">
            {resolution.form.salesLead.businessName} - the more detail you give us here, the more accurate your
            proposal will be. You don&apos;t need to finish everything at once.
          </p>
        </div>

        <DiscoveryFormFields initial={resolution.form} onSubmit={submitDiscoveryFormByToken.bind(null, token)} />
      </Container>
    </div>
  );
}
