import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getDiscoveryFormById } from "@/features/discovery-forms/server/queries";
import { DiscoveryFormResponse } from "@/features/discovery-forms/components/admin/discovery-form-response";

interface DiscoveryFormDetailPageProps {
  params: Promise<{ id: string; formId: string }>;
}

export const metadata: Metadata = { title: "Discovery Form Response" };

export default async function SalesPortalDiscoveryFormDetailPage({ params }: DiscoveryFormDetailPageProps) {
  const user = await requireRole("SALES");
  const { id, formId } = await params;

  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const form = await getDiscoveryFormById(formId, viewer);
  if (!form || form.salesLeadId !== id) notFound();

  return (
    <>
      <SetPageTitle title={`Discovery Form - ${form.salesLead.businessName}`} />
      <Container className="py-8">
        <DiscoveryFormResponse form={form} />
      </Container>
    </>
  );
}
