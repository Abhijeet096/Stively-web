import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDraftRequest } from "@/features/offering-requests/server/queries";
import { buildInitialWizardValues } from "@/features/offering-requests/lib/wizard-values";
import { RequestWizard } from "@/features/offering-requests/components/wizard/request-wizard";

interface RequestProposalPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Request Proposal",
  robots: { index: false, follow: false },
};

/** Business twin of src/app/enroll/[slug]/page.tsx - see that file's comment on why auth is inlined here instead of requireRole. */
export default async function RequestProposalPage({ params }: RequestProposalPageProps) {
  const { slug } = await params;
  const path = `/request-proposal/${slug}`;

  const offering = await prisma.offering.findFirst({
    where: { slug, status: "PUBLISHED", visible: true },
  });
  if (!offering || offering.audience === "STUDENT") {
    notFound();
  }

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }
  if (session.user.role !== "CLIENT") {
    redirect("/unauthorized");
  }

  const request = await getOrCreateDraftRequest(session.user.id, offering.id, "BUSINESS", "offering-detail");
  // Session only carries id/role (see src/types/next-auth.d.ts) - companyName
  // lives on the User row, fetched separately to prefill the Company step.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyName: true },
  });
  const initialValues = buildInitialWizardValues(request, {
    companyName: user?.companyName ?? "",
  });

  return (
    <>
      <div className="mb-8 flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Requesting a proposal for</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{offering.title}</h1>
      </div>
      <RequestWizard
        requestId={request.id}
        requestType="BUSINESS"
        initialStepIndex={request.currentStep - 1}
        initialValues={initialValues}
        detailPathPrefix="/client/requests"
      />
    </>
  );
}
