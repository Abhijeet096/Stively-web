import type { Metadata } from "next";
import type { SalesCommissionStatus } from "@prisma/client";

import { requireRole } from "@/lib/session";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesCommissionsForViewer, getSalesTeamMembers } from "@/features/sales-crm/server/queries";
import { AdminCommissionFilters } from "@/features/sales-crm/components/admin/admin-commission-filters";
import { AdminCommissionTable } from "@/features/sales-crm/components/admin/admin-commission-table";
import { SalesCrmSubnav } from "@/features/sales-crm/components/admin/sales-crm-subnav";

interface AdminCommissionPageProps {
  searchParams: Promise<{ status?: string; salesPersonId?: string }>;
}

export const metadata: Metadata = { title: "Commission" };

export default async function AdminCommissionPage({ searchParams }: AdminCommissionPageProps) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const params = await searchParams;

  const [viewer, teamMembers] = await Promise.all([resolveSalesCrmViewer(user.id, user.role), getSalesTeamMembers()]);

  const commissions = await getSalesCommissionsForViewer(viewer, {
    status: params.status as SalesCommissionStatus | undefined,
    salesPersonId: params.salesPersonId,
  });

  return (
    <div className="flex flex-col gap-8 p-6">
      <SalesCrmSubnav active="Commission" />

      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Commission</h1>
        <p className="text-muted-foreground text-sm">
          {commissions.length} commission{commissions.length === 1 ? "" : "s"}. Generated automatically when a project payment is marked paid.
        </p>
      </div>

      <AdminCommissionFilters status={params.status} salesPersonId={params.salesPersonId} teamMembers={teamMembers} />

      <AdminCommissionTable commissions={commissions} />
    </div>
  );
}
