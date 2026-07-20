import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOperationsViewer } from "@/features/operations/server/rbac";
import { getOperationItems, getOperationsDashboardStats } from "@/features/operations/server/queries";
import { parseOperationFilters } from "@/features/operations/validation/operation-filters";
import { OperationsDashboardWidgets } from "@/features/operations/components/dashboard-widgets";
import { OperationFiltersToolbar } from "@/features/operations/components/operation-filters-toolbar";
import { OperationList } from "@/features/operations/components/operation-list";
import { OperationPagination } from "@/features/operations/components/operation-pagination";

export const metadata: Metadata = { title: "Operations" };

interface OperationsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/**
 * The Operations Engine's home - widgets on top (same two-tier layout as
 * /admin/dashboard's Lead overview), searchable/filterable list below.
 * `(dashboard)/layout.tsx` already gates ADMIN/SUPER_ADMIN; this page adds
 * the finer-grained TeamMemberRole scoping (resolveOperationsViewer) on
 * top - a COUNSELLOR/SALESPERSON/SUPPORT-linked admin sees only their own
 * assignments, enforced in the query layer, not just hidden here.
 */
export default async function OperationsPage({ searchParams }: OperationsPageProps) {
  const session = await auth();
  const viewer = await resolveOperationsViewer(session!.user.id, session!.user.role);

  const params = await searchParams;
  const filters = parseOperationFilters(params);

  const [stats, { items, totalCount, totalPages, page }, teamMembers] = await Promise.all([
    getOperationsDashboardStats(viewer),
    getOperationItems(viewer, filters),
    prisma.teamMember.findMany({ orderBy: { name: "asc" } }),
  ]);

  const hasActiveFilters = !!(filters.q || filters.type || filters.status || filters.priority || filters.assignedTo);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="text-muted-foreground text-sm">
          {totalCount} item{totalCount === 1 ? "" : "s"}
          {!viewer.hasFullAccess && " assigned to you"}
        </p>
      </div>

      <OperationsDashboardWidgets stats={stats} />

      <div className="flex flex-col gap-6">
        <OperationFiltersToolbar teamMembers={teamMembers} />
        <OperationList items={items} hasActiveFilters={hasActiveFilters} />
        <OperationPagination page={page} totalPages={totalPages} searchParams={params} />
      </div>
    </div>
  );
}
