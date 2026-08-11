import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getOnboardingFormById } from "@/features/onboarding-forms/server/queries";
import { OnboardingFormResponse } from "@/features/onboarding-forms/components/admin/onboarding-form-response";

interface OnboardingFormDetailPageProps {
  params: Promise<{ id: string; formId: string }>;
}

export const metadata: Metadata = { title: "Onboarding Form Response" };

export default async function SalesPortalOnboardingFormDetailPage({ params }: OnboardingFormDetailPageProps) {
  const user = await requireRole("SALES");
  const { id, formId } = await params;

  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const form = await getOnboardingFormById(formId, viewer);
  if (!form || form.salesProjectId !== id) notFound();

  return (
    <>
      <SetPageTitle title={`Onboarding Form - ${form.salesProject.name}`} />
      <Container className="py-8">
        <OnboardingFormResponse form={form} />
      </Container>
    </>
  );
}
