import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Sparkles, Flame, ArrowRightLeft, TrendingUp } from "lucide-react";

import { requireRole } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLeadIntelligenceDashboardStats, getBusinesses } from "@/features/lead-intelligence/server/queries";
import { getDiscoverySourcesChart, getOpportunityScoreDistributionChart, getMonthlyDiscoveriesChart } from "@/features/lead-intelligence/server/dashboard-charts";
import { LeadIntelligenceBarChart } from "@/features/lead-intelligence/components/shared/lead-intelligence-bar-chart";
import { LeadIntelligenceSubnav } from "@/features/lead-intelligence/components/admin/lead-intelligence-subnav";
import { BusinessList } from "@/features/lead-intelligence/components/admin/business-list";

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

export const metadata: Metadata = { title: "Lead Intelligence" };

export default async function LeadIntelligenceDashboardPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const [stats, { businesses }, discoverySources, scoreDistribution, monthlyDiscoveries] = await Promise.all([
    getLeadIntelligenceDashboardStats(),
    getBusinesses({ page: 1 }),
    getDiscoverySourcesChart(),
    getOpportunityScoreDistributionChart(),
    getMonthlyDiscoveriesChart(),
  ]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <LeadIntelligenceSubnav active="Dashboard" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Lead Intelligence</h1>
          <p className="text-muted-foreground text-sm">Real, publicly-sourced businesses, AI-scored and ready to pursue.</p>
        </div>
        <Button asChild>
          <Link href="/admin/lead-intelligence/discover">
            <Sparkles className="size-4" aria-hidden="true" />
            Discover businesses
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Businesses" value={stats.totalBusinesses} icon={Building2} />
        <StatTile label="New This Week" value={stats.newThisWeek} icon={TrendingUp} />
        <StatTile label="Hot Leads (75+)" value={stats.hotLeads} icon={Flame} />
        <StatTile label="Promoted to Sales" value={stats.promoted} icon={ArrowRightLeft} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Discovery Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadIntelligenceBarChart data={discoverySources} emptyLabel="No businesses discovered yet." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Opportunity Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadIntelligenceBarChart data={scoreDistribution} emptyLabel="No AI reports generated yet." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Discoveries</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadIntelligenceBarChart data={monthlyDiscoveries} emptyLabel="No businesses discovered in the last 6 months yet." />
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-foreground text-lg font-semibold tracking-tight">Recent businesses</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/lead-intelligence/businesses">View all</Link>
          </Button>
        </div>
        <BusinessList businesses={businesses.slice(0, 8)} />
      </section>
    </div>
  );
}
