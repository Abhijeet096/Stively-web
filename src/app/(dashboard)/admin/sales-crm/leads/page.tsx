import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import type { SalesLeadStatus, LeadPriority, SalesLeadSource } from "@prisma/client";

import { requireRole } from "@/lib/session";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesLeads, getSalesTeamMembers } from "@/features/sales-crm/server/queries";
import { SalesLeadList } from "@/features/sales-crm/components/admin/sales-lead-list";
import { SalesLeadFiltersToolbar } from "@/features/sales-crm/components/admin/sales-lead-filters-toolbar";
import { SalesLeadPagination } from "@/features/sales-crm/components/admin/sales-lead-pagination";
import { Button } from "@/components/ui/button";

interface SalesLeadsPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    source?: string;
    assignedToId?: string;
    q?: string;
    page?: string;
  }>;
}

export const metadata: Metadata = { title: "Sales Leads" };

export default async function SalesLeadsPage({ searchParams }: SalesLeadsPageProps) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const params = await searchParams;

  const [viewer, teamMembers] = await Promise.all([
    resolveSalesCrmViewer(user.id, user.role),
    getSalesTeamMembers(),
  ]);

  const { leads, totalCount, totalPages, page } = await getSalesLeads(
    {
      status: params.status as SalesLeadStatus | undefined,
      priority: params.priority as LeadPriority | undefined,
      source: params.source as SalesLeadSource | undefined,
      assignedToId: params.assignedToId,
      search: params.q,
      page: params.page ? Number(params.page) : undefined,
    },
    viewer
  );

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Sales Leads</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} lead{totalCount === 1 ? "" : "s"}
            {!viewer.hasFullAccess ? " assigned to you" : ""}.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/sales-crm/leads/new">
            <UserPlus className="size-4" aria-hidden="true" />
            Add lead
          </Link>
        </Button>
      </div>

      <SalesLeadFiltersToolbar teamMembers={teamMembers} showAssigneeFilter={viewer.hasFullAccess} />

      <SalesLeadList leads={leads} />

      <SalesLeadPagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
