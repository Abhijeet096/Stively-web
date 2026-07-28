import Link from "next/link";
import { User, HardHat, ClipboardList } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { formatSalesProjectNumber } from "../../lib/reference-number";
import { SALES_PROJECT_STATUS_LABEL, SALES_PROJECT_STATUS_VARIANT, SALES_COMMISSION_STATUS_LABEL, SALES_COMMISSION_STATUS_VARIANT } from "../../lib/labels";
import { SalesProjectStatusChanger } from "./sales-project-status-changer";
import { SalesProjectPaymentsPanel } from "./sales-project-payments-panel";
import { SalesProjectUpdatesPanel } from "./sales-project-updates-panel";
import { SalesProjectMilestonesPanel } from "./sales-project-milestones-panel";
import { SalesProjectProgressEditor } from "./sales-project-progress-editor";
import type { SalesProjectWithRelations } from "../../server/queries";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function SalesProjectDetail({ project, leadBasePath = "/admin/sales-crm/leads" }: { project: SalesProjectWithRelations; leadBasePath?: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">{project.clientName}</h1>
            <Badge variant={SALES_PROJECT_STATUS_VARIANT[project.status]}>{SALES_PROJECT_STATUS_LABEL[project.status]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {formatSalesProjectNumber(project.sequence)} ·{" "}
            <Link href={`${leadBasePath}/${project.salesLeadId}`} className="hover:underline">
              View originating lead
            </Link>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2.5 sm:grid-cols-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <User className="size-4 shrink-0" aria-hidden="true" />
                <span className="text-foreground">Sales: {project.salesPerson?.name ?? "Unassigned"}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
                <span className="text-foreground">PM: {project.projectManager?.name ?? "Unassigned"}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <HardHat className="size-4 shrink-0" aria-hidden="true" />
                <span className="text-foreground">Developer: {project.assignedDeveloper?.name ?? "Unassigned"}</span>
              </div>
              <div className="text-muted-foreground text-sm">
                Agreed value: <span className="text-foreground font-medium">{formatPrice(project.totalValue)}</span>
              </div>
              <div className="text-muted-foreground text-sm">Started: {formatDate(project.startDate)}</div>
              <div className="text-muted-foreground text-sm">Target end: {formatDate(project.targetEndDate)}</div>
              {project.description && <p className="text-muted-foreground col-span-full text-sm">{project.description}</p>}
            </CardContent>
          </Card>

          <SalesProjectPaymentsPanel salesProjectId={project.id} payments={project.payments} />

          <SalesProjectUpdatesPanel salesProjectId={project.id} updates={project.updates} />

          <SalesProjectMilestonesPanel salesProjectId={project.id} milestones={project.milestones} />

          <Card>
            <CardHeader>
              <CardTitle>Commission</CardTitle>
            </CardHeader>
            <CardContent>
              {project.commissions.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No commission generated yet - it&apos;s created automatically once a payment is marked paid.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {project.commissions.map((c) => (
                    <li key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">
                        {formatPrice(c.commissionAmount)} ({c.commissionPercentage}%)
                      </span>
                      <Badge variant={SALES_COMMISSION_STATUS_VARIANT[c.status]}>{SALES_COMMISSION_STATUS_LABEL[c.status]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesProjectStatusChanger salesProjectId={project.id} currentStatus={project.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client-facing progress</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesProjectProgressEditor
                salesProjectId={project.id}
                progressPercent={project.progressPercent}
                warrantyExpiresAt={project.warrantyExpiresAt}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { SalesProjectDetail };
