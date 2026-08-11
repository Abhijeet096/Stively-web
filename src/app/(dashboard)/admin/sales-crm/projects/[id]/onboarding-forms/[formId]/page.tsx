import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/session";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getOnboardingFormById } from "@/features/onboarding-forms/server/queries";
import { OnboardingFormResponse } from "@/features/onboarding-forms/components/admin/onboarding-form-response";
import { Button } from "@/components/ui/button";

interface OnboardingFormDetailPageProps {
  params: Promise<{ id: string; formId: string }>;
}

export const metadata: Metadata = { title: "Onboarding Form Response" };

export default async function OnboardingFormDetailPage({ params }: OnboardingFormDetailPageProps) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const { id, formId } = await params;

  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const form = await getOnboardingFormById(formId, viewer);
  if (!form || form.salesProjectId !== id) notFound();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/sales-crm/projects/${id}`} aria-label="Back to project">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Onboarding Form - {form.salesProject.name}
        </h1>
      </div>

      <OnboardingFormResponse form={form} />
    </div>
  );
}
