import type { Metadata } from "next";
import { IndianRupee, Clock, CheckCircle2, Wallet } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { StatCard } from "@/components/dashboard-shell/widgets/stat-card";
import { Container } from "@/components/shared/container";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { formatPrice } from "@/lib/utils";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesCommissionsForViewer, getSalesDashboardStats } from "@/features/sales-crm/server/queries";
import { SALES_COMMISSION_STATUS_LABEL, SALES_COMMISSION_STATUS_VARIANT } from "@/features/sales-crm/lib/labels";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export const metadata: Metadata = { title: "Commission" };

export default async function SalesCommissionPage() {
  const user = await requireRole("SALES");
  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const [commissions, stats] = await Promise.all([getSalesCommissionsForViewer(viewer), getSalesDashboardStats(viewer)]);

  return (
    <>
      <SetPageTitle title="Commission" />
      <Container className="flex flex-col gap-8 py-8">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Commission</h1>
          <p className="text-muted-foreground text-sm">
            Generated automatically whenever a payment is recorded against one of your projects.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Earnings" value={formatPrice(stats.totalCommission)} icon={Wallet} />
          <StatCard label="Pending" value={formatPrice(stats.pendingCommission)} icon={Clock} />
          <StatCard label="Paid" value={formatPrice(stats.paidCommission)} icon={CheckCircle2} />
          <StatCard label="This Month" value={formatPrice(stats.monthlyEarnings)} icon={IndianRupee} />
        </div>

        {commissions.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No commission yet"
            description="Commission appears here automatically once a project payment is recorded against a won lead."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                {viewer.hasFullAccess && <TableHead>Salesperson</TableHead>}
                <TableHead>Payment</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-foreground font-medium">{c.salesProject.clientName}</TableCell>
                  {viewer.hasFullAccess && <TableCell className="text-muted-foreground">{c.salesPerson.name}</TableCell>}
                  <TableCell className="text-muted-foreground tabular-nums">{formatPrice(c.paymentAmount)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{c.commissionPercentage}%</TableCell>
                  <TableCell className="text-foreground tabular-nums">{formatPrice(c.commissionAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={SALES_COMMISSION_STATUS_VARIANT[c.status]}>{SALES_COMMISSION_STATUS_LABEL[c.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Container>
    </>
  );
}
