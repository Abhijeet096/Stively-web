import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesProjectsForViewer } from "@/features/sales-crm/server/queries";
import { SalesProjectList } from "@/features/sales-crm/components/admin/sales-project-list";
import { SalesCrmSubnav } from "@/features/sales-crm/components/admin/sales-crm-subnav";

export const metadata: Metadata = { title: "Projects" };

export default async function SalesProjectsPage() {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const projects = await getSalesProjectsForViewer(viewer);

  return (
    <div className="flex flex-col gap-8 p-6">
      <SalesCrmSubnav active="Projects" />

      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground text-sm">
          {projects.length} project{projects.length === 1 ? "" : "s"}, converted from Won leads.
        </p>
      </div>
      <SalesProjectList projects={projects} />
    </div>
  );
}
