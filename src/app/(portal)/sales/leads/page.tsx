import type { Metadata } from "next";
import type { SalesLeadStatus, LeadPriority, SalesLeadSource } from "@prisma/client";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesLeads, getSalesTeamMembers } from "@/features/sales-crm/server/queries";
import { SalesLeadList } from "@/features/sales-crm/components/admin/sales-lead-list";
import { SalesLeadFiltersToolbar } from "@/features/sales-crm/components/admin/sales-lead-filters-toolbar";
import { SalesLeadPagination } from "@/features/sales-crm/components/admin/sales-lead-pagination";

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

export const metadata: Metadata = { title: "My Leads" };

export default async function SalesPortalLeadsPage({ searchParams }: SalesLeadsPageProps) {
  const user = await requireRole("SALES");
  const params = await searchParams;

  const [viewer, teamMembers] = await Promise.all([resolveSalesCrmViewer(user.id, user.role), getSalesTeamMembers()]);

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
    <>
      <SetPageTitle title="My Leads" />
      <Container className="flex flex-col gap-8 py-8">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">{viewer.hasFullAccess ? "Team Leads" : "My Leads"}</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} lead{totalCount === 1 ? "" : "s"}
            {!viewer.hasFullAccess ? " assigned to you" : ""}.
          </p>
        </div>

        <SalesLeadFiltersToolbar teamMembers={teamMembers} showAssigneeFilter={viewer.hasFullAccess} />

        <SalesLeadList leads={leads} basePath="/sales/leads" />

        <SalesLeadPagination page={page} totalPages={totalPages} searchParams={params} basePath="/sales/leads" />
      </Container>
    </>
  );
}
