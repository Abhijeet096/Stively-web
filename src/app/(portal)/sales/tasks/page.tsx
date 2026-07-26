import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesTasksForViewer } from "@/features/sales-crm/server/queries";
import { SalesTaskList } from "@/features/sales-crm/components/sales/sales-task-list";

export const metadata: Metadata = { title: "Tasks" };

export default async function SalesTasksPage() {
  const user = await requireRole("SALES");
  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const tasks = await getSalesTasksForViewer(viewer);

  return (
    <>
      <SetPageTitle title="Tasks" />
      <Container className="flex flex-col gap-8 py-8">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm">{tasks.length} task{tasks.length === 1 ? "" : "s"}.</p>
        </div>
        <SalesTaskList tasks={tasks} />
      </Container>
    </>
  );
}
