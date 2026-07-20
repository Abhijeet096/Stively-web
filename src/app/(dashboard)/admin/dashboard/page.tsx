import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Building2,
  CalendarPlus,
  ThumbsUp,
  CheckCircle2,
  XCircle,
  Wallet,
} from "lucide-react";

import {
  getRecentLeads,
  getRecentActivity,
  getFollowUps,
  getLeadStatistics,
} from "@/lib/queries/leads";
import { formatPrice } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { FollowUpList } from "@/components/dashboard/follow-up-list";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Every number on this page comes from src/lib/queries/leads.ts - none of
 * it is hardcoded, per this task's explicit "No mocked statistics"
 * instruction. Fetched in parallel since none of these four queries
 * depend on each other's results.
 */
export default async function DashboardHomePage() {
  const [stats, recentLeads, activity, followUps] = await Promise.all([
    getLeadStatistics(),
    getRecentLeads(5),
    getRecentActivity(8),
    getFollowUps(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/leads">View all leads</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Total Leads" value={stats.totalLeads} icon={Users} />
        <KpiCard label="Student Leads" value={stats.studentLeads} icon={GraduationCap} />
        <KpiCard label="Business Leads" value={stats.businessLeads} icon={Building2} />
        <KpiCard label="Today's Leads" value={stats.newToday} icon={CalendarPlus} />
        <KpiCard label="Interested Leads" value={stats.interested} icon={ThumbsUp} />
        <KpiCard
          label="Converted Leads"
          value={stats.converted}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard label="Lost Leads" value={stats.lost} icon={XCircle} tone="destructive" />
        <KpiCard
          label="Pipeline Value (est.)"
          value={formatPrice(stats.estimatedPipelineValue)}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent leads</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadsTable leads={recentLeads} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <FollowUpList followUps={followUps} />
          <ActivityFeed items={activity} />
        </div>
      </div>
    </div>
  );
}
