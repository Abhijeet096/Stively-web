import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/sections/empty-state";
import { BarChart3 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { SALES_LEAD_SOURCE_LABEL } from "@/features/sales-crm/lib/labels";
import {
  getSalesLeaderboard,
  getConversionRateReport,
  getRevenueBySalesPerson,
  getCommissionReport,
  getLeadSourceReport,
  getLostLeadAnalysis,
} from "@/features/sales-crm/server/reports";
import { getRevenueChart } from "@/features/sales-crm/server/dashboard-charts";
import { SalesBarChart } from "@/features/sales-crm/components/shared/sales-bar-chart";
import { SalesCrmSubnav } from "@/features/sales-crm/components/admin/sales-crm-subnav";

export const metadata: Metadata = { title: "Reports" };

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function SalesCrmReportsPage() {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const viewer = await resolveSalesCrmViewer(user.id, user.role);

  const [monthlyRevenue, leaderboard, conversion, revenueBySalesPerson, commissionReport, leadSourceReport, lostLeadAnalysis] = await Promise.all([
    getRevenueChart(viewer, 6),
    getSalesLeaderboard(),
    getConversionRateReport(viewer),
    getRevenueBySalesPerson(),
    getCommissionReport(),
    getLeadSourceReport(viewer),
    getLostLeadAnalysis(viewer),
  ]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <SalesCrmSubnav active="Reports" />

      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm">Real numbers from your pipeline - nothing here is estimated or fabricated.</p>
      </div>

      <ReportCard title="Monthly Revenue">
        <SalesBarChart data={monthlyRevenue} emptyLabel="No revenue recorded in the last 6 months yet." formatValue={(v) => formatPrice(v * 100)} />
      </ReportCard>

      <ReportCard title="Sales Leaderboard">
        {leaderboard.length === 0 ? (
          <EmptyState icon={BarChart3} title="No salespeople yet" description="Add a Sales Executive or Sales Manager to see rankings." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead>Won Leads</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((row) => (
                <TableRow key={row.teamMemberId}>
                  <TableCell className="text-foreground font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{row.wonLeads}</TableCell>
                  <TableCell className="text-foreground tabular-nums">{formatPrice(row.totalRevenue)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatPrice(row.totalCommission)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ReportCard>

      <ReportCard title="Conversion Rate">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Total Leads</p>
            <p className="text-foreground text-2xl font-semibold tabular-nums">{conversion.totalLeads}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Won</p>
            <p className="text-foreground text-2xl font-semibold tabular-nums">{conversion.won}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Lost</p>
            <p className="text-foreground text-2xl font-semibold tabular-nums">{conversion.lost}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Conversion Rate</p>
            <p className="text-foreground text-2xl font-semibold tabular-nums">{conversion.conversionRate}%</p>
          </div>
        </div>
      </ReportCard>

      <ReportCard title="Revenue by Sales Person">
        {revenueBySalesPerson.length === 0 ? (
          <EmptyState icon={BarChart3} title="No revenue yet" description="Revenue appears here once project payments are marked paid." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueBySalesPerson.map((row) => (
                <TableRow key={row.teamMemberId}>
                  <TableCell className="text-foreground font-medium">{row.name}</TableCell>
                  <TableCell className="text-foreground tabular-nums">{formatPrice(row.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ReportCard>

      <ReportCard title="Commission Report">
        {commissionReport.length === 0 ? (
          <EmptyState icon={BarChart3} title="No commission yet" description="Commission appears here once payments are marked paid." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionReport.map((row) => (
                <TableRow key={row.teamMemberId}>
                  <TableCell className="text-foreground font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatPrice(row.pending)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatPrice(row.approved)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatPrice(row.paid)}</TableCell>
                  <TableCell className="text-foreground tabular-nums">{formatPrice(row.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ReportCard>

      <ReportCard title="Lead Source Report">
        {leadSourceReport.length === 0 ? (
          <EmptyState icon={BarChart3} title="No leads yet" description="Sources appear here once leads are created." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Won</TableHead>
                <TableHead>Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadSourceReport.map((row) => (
                <TableRow key={row.source}>
                  <TableCell className="text-foreground font-medium">{SALES_LEAD_SOURCE_LABEL[row.source as keyof typeof SALES_LEAD_SOURCE_LABEL]}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{row.total}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{row.won}</TableCell>
                  <TableCell className="text-foreground tabular-nums">{row.conversionRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ReportCard>

      <ReportCard title="Lost Lead Analysis">
        {lostLeadAnalysis.length === 0 ? (
          <EmptyState icon={BarChart3} title="No lost leads" description="Nothing lost yet - good sign." />
        ) : (
          <SalesBarChart data={lostLeadAnalysis.map((r) => ({ label: r.reason, value: r.count }))} emptyLabel="No lost leads yet." />
        )}
      </ReportCard>
    </div>
  );
}
