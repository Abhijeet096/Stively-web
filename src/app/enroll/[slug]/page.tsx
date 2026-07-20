import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDraftRequest } from "@/features/offering-requests/server/queries";
import { buildInitialWizardValues } from "@/features/offering-requests/lib/wizard-values";
import { RequestWizard } from "@/features/offering-requests/components/wizard/request-wizard";

interface EnrollPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Enroll",
  robots: { index: false, follow: false },
};

/**
 * Not wrapped in requireRole (src/lib/session.ts) on purpose: that helper's
 * "no session" path is a bare redirect("/login") with no way back. This
 * page wants the visitor to land right back here after logging in, so it
 * inlines the same role-mismatch behavior (-> /unauthorized) but adds a
 * callbackUrl for the missing-session case - same pattern
 * ProgramHero's `/signup?callbackUrl=` already uses elsewhere in this app.
 */
export default async function EnrollPage({ params }: EnrollPageProps) {
  const { slug } = await params;
  const path = `/enroll/${slug}`;

  const offering = await prisma.offering.findFirst({
    where: { slug, status: "PUBLISHED", visible: true },
  });
  if (!offering || offering.audience === "BUSINESS") {
    notFound();
  }

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }
  if (session.user.role !== "STUDENT") {
    redirect("/unauthorized");
  }

  const request = await getOrCreateDraftRequest(session.user.id, offering.id, "STUDENT", "offering-detail");
  const initialValues = buildInitialWizardValues(request, {
    fullName: session.user.name ?? "",
  });

  return (
    <>
      <div className="mb-8 flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Enrolling in</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{offering.title}</h1>
      </div>
      <RequestWizard
        requestId={request.id}
        requestType="STUDENT"
        initialStepIndex={request.currentStep - 1}
        initialValues={initialValues}
        detailPathPrefix="/student/requests"
      />
    </>
  );
}
