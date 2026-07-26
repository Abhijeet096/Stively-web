import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesProjectById } from "@/features/sales-crm/server/queries";
import { SalesProjectDetail } from "@/features/sales-crm/components/admin/sales-project-detail";

interface SalesPortalProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Project Detail" };

export default async function SalesPortalProjectDetailPage({ params }: SalesPortalProjectDetailPageProps) {
  const user = await requireRole("SALES");
  const { id } = await params;

  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const project = await getSalesProjectById(id, viewer);
  if (!project) notFound();

  return (
    <>
      <SetPageTitle title={project.clientName} />
      <Container className="py-8">
        <SalesProjectDetail project={project} leadBasePath="/sales/leads" />
      </Container>
    </>
  );
}
