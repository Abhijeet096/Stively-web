import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesProjectById } from "@/features/sales-crm/server/queries";
import { SalesProjectDetail } from "@/features/sales-crm/components/admin/sales-project-detail";

interface SalesProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Project Detail" };

export default async function SalesProjectDetailPage({ params }: SalesProjectDetailPageProps) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const { id } = await params;

  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const project = await getSalesProjectById(id, viewer);
  if (!project) notFound();

  return (
    <div className="p-6">
      <SalesProjectDetail project={project} />
    </div>
  );
}
