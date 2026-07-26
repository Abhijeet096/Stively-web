import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesProjectsForViewer } from "@/features/sales-crm/server/queries";
import { SalesProjectList } from "@/features/sales-crm/components/admin/sales-project-list";

export const metadata: Metadata = { title: "Projects" };

export default async function SalesPortalProjectsPage() {
  const user = await requireRole("SALES");
  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const projects = await getSalesProjectsForViewer(viewer);

  return (
    <>
      <SetPageTitle title="Projects" />
      <Container className="flex flex-col gap-8 py-8">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {viewer.hasFullAccess ? "Team Projects" : "My Projects"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {projects.length} project{projects.length === 1 ? "" : "s"}, converted from Won leads.
          </p>
        </div>
        <SalesProjectList projects={projects} basePath="/sales/projects" />
      </Container>
    </>
  );
}
