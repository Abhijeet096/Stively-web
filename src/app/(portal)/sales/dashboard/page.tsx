import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CalendarClock, ThumbsUp, FileText, Handshake, Trophy, XCircle, IndianRupee, Clock, CheckCircle2, Wallet, Clock3 } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { StatCard } from "@/components/dashboard-shell/widgets/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/sections/empty-state";
import { formatPrice } from "@/lib/utils";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getSalesDashboardStats, getSalesLeads } from "@/features/sales-crm/server/queries";
import {
  getMonthlyLeadsChart,
  getLeadConversionChart,
  getRevenueChart,
  getCommissionChart,
  getFollowUpPerformanceChart,
  getLeadSourcesChart,
} from "@/features/sales-crm/server/dashboard-charts";
import { SalesLeadList } from "@/features/sales-crm/components/admin/sales-lead-list";
import { SalesBarChart } from "@/features/sales-crm/components/shared/sales-bar-chart";

export const metadata: Metadata = { title: "Sales Dashboard" };

export default async function SalesDashboardPage() {
  const user = await requireRole("SALES");
  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const firstName = user.name?.split(" ")[0];

  const stats = await getSalesDashboardStats(viewer);

  // A brand-new hire with nothing assigned yet shouldn't stare at a wall of
  // zero-value cards and empty charts - that reads as broken, not as "your
  // pipeline is genuinely empty." Show a clean, deliberate waiting state
  // instead, and skip every other query below entirely.
  if (!viewer.hasFullAccess && stats.assignedLeads === 0) {
    return (
      <>
        <SetPageTitle title="Sales Dashboard" />
        <Container className="flex flex-col gap-10 py-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Welcome{firstName ? `, ${firstName}` : ""}</h2>
            <p className="text-muted-foreground text-sm">Here&apos;s where your pipeline will show up once you have leads.</p>
          </div>
          <Card>
            <CardContent>
              <EmptyState
                icon={Clock3}
                title="No leads assigned yet"
                description="Your manager hasn't assigned you any leads. Once they do, you'll see your pipeline, follow-ups, and commission right here."
              />
            </CardContent>
          </Card>
        </Container>
      </>
    );
  }

  const [{ leads }, monthlyLeads, conversion, revenue, commission, followUpPerformance, leadSources] = await Promise.all([
    getSalesLeads({ page: 1 }, viewer),
    getMonthlyLeadsChart(viewer),
    getLeadConversionChart(viewer),
    getRevenueChart(viewer),
    getCommissionChart(viewer),
    getFollowUpPerformanceChart(viewer),
    getLeadSourcesChart(viewer),
  ]);

  return (
    <>
      <SetPageTitle title="Sales Dashboard" />
      <Container className="flex flex-col gap-10 py-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Welcome{firstName ? `, ${firstName}` : ""}</h2>
          <p className="text-muted-foreground text-sm">
            {viewer.hasFullAccess ? "Here's how the whole team's pipeline looks." : "Here's where your pipeline stands today."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Assigned Leads" value={stats.assignedLeads} icon={Building2} />
          <StatCard label="Today's Follow-ups" value={stats.todaysFollowUps} icon={CalendarClock} />
          <StatCard label="Interested Leads" value={stats.interested} icon={ThumbsUp} />
          <StatCard label="Proposal Sent" value={stats.proposalSent} icon={FileText} />
          <StatCard label="Negotiation" value={stats.negotiation} icon={Handshake} />
          <StatCard label="Won Leads" value={stats.won} icon={Trophy} />
          <StatCard label="Lost Leads" value={stats.lost} icon={XCircle} />
          <StatCard label="Monthly Revenue" value={formatPrice(stats.monthlyRevenue)} icon={IndianRupee} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pending Commission" value={formatPrice(stats.pendingCommission)} icon={Clock} />
          <StatCard label="Paid Commission" value={formatPrice(stats.paidCommission)} icon={CheckCircle2} />
          <StatCard label="Total Commission" value={formatPrice(stats.totalCommission)} icon={Wallet} />
          <StatCard label="Monthly Earnings" value={formatPrice(stats.monthlyEarnings)} icon={IndianRupee} />
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
          <SectionHeader
            title={viewer.hasFullAccess ? "Recent leads" : "Your leads"}
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/sales/leads">View all</Link>
              </Button>
            }
          />
          <SalesLeadList leads={leads.slice(0, 8)} basePath="/sales/leads" />
        </section>
      </Container>
    </>
  );
}
