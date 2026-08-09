import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CalendarClock, ThumbsUp, FileText, Handshake, Trophy, XCircle, IndianRupee, Clock, CheckCircle2, Wallet, UserPlus } from "lucide-react";

import { requireRole } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesDashboardStats, getSalesLeads, getUnreadMessageThreads } from "@/features/sales-crm/server/queries";
import {
  getMonthlyLeadsChart,
  getLeadConversionChart,
  getRevenueChart,
  getCommissionChart,
  getFollowUpPerformanceChart,
  getLeadSourcesChart,
} from "@/features/sales-crm/server/dashboard-charts";
import { SalesLeadList } from "@/features/sales-crm/components/admin/sales-lead-list";
import { UnreadMessagesWidget } from "@/features/sales-crm/components/admin/unread-messages-widget";
import { SalesBarChart } from "@/features/sales-crm/components/shared/sales-bar-chart";
import { SalesCrmSubnav } from "@/features/sales-crm/components/admin/sales-crm-subnav";

function StatTile({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex flex-row items-center gap-4">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
          <p className="text-foreground text-2xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export const metadata: Metadata = { title: "Sales CRM Overview" };

/** Company-wide equivalent of /sales/dashboard - same stats/charts, always full-access since it's Admin/Super Admin-gated. */
export default async function SalesCrmOverviewPage() {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const viewer = await resolveSalesCrmViewer(user.id, user.role);

  const [stats, { leads }, monthlyLeads, conversion, revenue, commission, followUpPerformance, leadSources, unreadThreads] =
    await Promise.all([
      getSalesDashboardStats(viewer),
      getSalesLeads({ page: 1 }, viewer),
      getMonthlyLeadsChart(viewer),
      getLeadConversionChart(viewer),
      getRevenueChart(viewer),
      getCommissionChart(viewer),
      getFollowUpPerformanceChart(viewer),
      getLeadSourcesChart(viewer),
      getUnreadMessageThreads(viewer),
    ]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <SalesCrmSubnav active="Overview" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Sales CRM Overview</h1>
          <p className="text-muted-foreground text-sm">Company-wide pipeline, revenue, and commission at a glance.</p>
        </div>
        <Button asChild>
          <Link href="/admin/sales-crm/leads/new">
            <UserPlus className="size-4" aria-hidden="true" />
            Add lead
          </Link>
        </Button>
      </div>

      <UnreadMessagesWidget threads={unreadThreads} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Assigned Leads" value={stats.assignedLeads} icon={Building2} />
        <StatTile label="Today's Follow-ups" value={stats.todaysFollowUps} icon={CalendarClock} />
        <StatTile label="Interested Leads" value={stats.interested} icon={ThumbsUp} />
        <StatTile label="Proposal Sent" value={stats.proposalSent} icon={FileText} />
        <StatTile label="Negotiation" value={stats.negotiation} icon={Handshake} />
        <StatTile label="Won Leads" value={stats.won} icon={Trophy} />
        <StatTile label="Lost Leads" value={stats.lost} icon={XCircle} />
        <StatTile label="Monthly Revenue" value={formatPrice(stats.monthlyRevenue)} icon={IndianRupee} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Pending Commission" value={formatPrice(stats.pendingCommission)} icon={Clock} />
        <StatTile label="Paid Commission" value={formatPrice(stats.paidCommission)} icon={CheckCircle2} />
        <StatTile label="Total Commission" value={formatPrice(stats.totalCommission)} icon={Wallet} />
        <StatTile label="Monthly Earnings" value={formatPrice(stats.monthlyEarnings)} icon={IndianRupee} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesBarChart data={monthlyLeads} emptyLabel="No leads created in the last 6 months yet." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesBarChart data={conversion} emptyLabel="No leads in the pipeline yet." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesBarChart data={revenue} emptyLabel="No revenue recorded in the last 6 months yet." formatValue={(v) => formatPrice(v * 100)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesBarChart data={commission} emptyLabel="No commission generated in the last 6 months yet." formatValue={(v) => formatPrice(v * 100)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Follow Up Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesBarChart data={followUpPerformance} emptyLabel="No follow-ups scheduled yet." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesBarChart data={leadSources} emptyLabel="No leads yet." />
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-foreground text-lg font-semibold tracking-tight">Recent leads</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/sales-crm/leads">View all</Link>
          </Button>
        </div>
        <SalesLeadList leads={leads.slice(0, 8)} basePath="/admin/sales-crm/leads" />
      </section>
    </div>
  );
}
