import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus, Upload } from "lucide-react";
import type { LeadPriority, SalesLeadSource } from "@prisma/client";

import { requireRole } from "@/lib/session";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesLeads, getSalesTeamMembers } from "@/features/sales-crm/server/queries";
import { PIPELINE_STAGES, getPipelineStage } from "@/features/sales-crm/lib/pipeline-stages";
import { SalesLeadList } from "@/features/sales-crm/components/admin/sales-lead-list";
import { SalesLeadFiltersToolbar } from "@/features/sales-crm/components/admin/sales-lead-filters-toolbar";
import { SalesLeadPagination } from "@/features/sales-crm/components/admin/sales-lead-pagination";
import { ExportLeadsButton } from "@/features/sales-crm/components/admin/export-leads-button";
import { SalesCrmSubnav } from "@/features/sales-crm/components/admin/sales-crm-subnav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SalesLeadsPageProps {
  searchParams: Promise<{
    status?: string;
    stage?: string;
    priority?: string;
    source?: string;
    assignedToId?: string;
    q?: string;
    page?: string;
  }>;
}

export const metadata: Metadata = { title: "Qualified Clients" };

/**
 * Every SalesLead here is already a qualified client - it only exists via a
 * qualification/promotion bridge (Lead, Business, OfferingRequest) or a
 * deliberate manual add, and already has full Client Workspace access
 * (messages, quotes, discovery forms) regardless of pipeline stage. This
 * page used to gate a "Clients only" view behind status=WON, which meant a
 * qualified prospect still mid-negotiation - already inside their client
 * workspace - never showed up under it. See AD-016: the fix is showing
 * everyone here by default, with stage as an optional narrowing, not a
 * gate on who counts as a client.
 */
export default async function SalesLeadsPage({ searchParams }: SalesLeadsPageProps) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const params = await searchParams;

  const [viewer, teamMembers] = await Promise.all([
    resolveSalesCrmViewer(user.id, user.role),
    getSalesTeamMembers(),
  ]);

  const stage = getPipelineStage(params.stage);

  const filters = {
    // Stage (coarse group) and status (exact single value from the filters
    // toolbar) are mutually exclusive narrowings - stage wins if somehow both are present.
    statusIn: stage?.statuses,
    status: stage ? undefined : (params.status as import("@prisma/client").SalesLeadStatus | undefined),
    priority: params.priority as LeadPriority | undefined,
    source: params.source as SalesLeadSource | undefined,
    assignedToId: params.assignedToId,
    search: params.q,
    page: params.page ? Number(params.page) : undefined,
  };

  const { leads, totalCount, totalPages, page } = await getSalesLeads(filters, viewer);

  return (
    <div className="flex flex-col gap-8 p-6">
      <SalesCrmSubnav active="Leads" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Qualified Clients</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} client{totalCount === 1 ? "" : "s"}
            {stage ? ` · ${stage.label}` : ""}
            {!viewer.hasFullAccess ? " assigned to you" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportLeadsButton filters={filters} />
          <Button variant="outline" asChild>
            <Link href="/admin/sales-crm/leads/import">
              <Upload className="size-4" aria-hidden="true" />
              Import
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/sales-crm/leads/new">
              <UserPlus className="size-4" aria-hidden="true" />
              Add lead
            </Link>
          </Button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2">
        <Link
          href="/admin/sales-crm/leads"
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            !stage ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </Link>
        {PIPELINE_STAGES.map((s) => (
          <Link
            key={s.key}
            href={`/admin/sales-crm/leads?stage=${s.key}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              stage?.key === s.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      <SalesLeadFiltersToolbar teamMembers={teamMembers} showAssigneeFilter={viewer.hasFullAccess} />

      <SalesLeadList leads={leads} />

      <SalesLeadPagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
