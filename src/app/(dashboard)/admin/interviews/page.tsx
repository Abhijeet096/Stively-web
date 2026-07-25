import type { Metadata } from "next";
import Link from "next/link";
import { Users, Clock, CheckCircle2, TrendingUp, ThumbsUp, Briefcase, UserPlus } from "lucide-react";

import {
  getInterviewOverviewStats,
  getRecentInterviews,
  getDailyInterviewCounts,
  getHiringFunnel,
  getScoreDistribution,
} from "@/features/interviews/server/dashboard-queries";
import { INTERVIEW_STATUS_LABEL, INTERVIEW_STATUS_VARIANT } from "@/features/interviews/lib/report-labels";
import { BarChart } from "@/features/interviews/components/admin/bar-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/sections/empty-state";

export const metadata: Metadata = { title: "Interviews" };

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Every number and chart here is a real live query (src/features/interviews/server/dashboard-queries.ts) - no fabricated stats, matching this codebase's dashboard convention. */
export default async function InterviewsOverviewPage() {
  const [stats, recent, daily, funnel, distribution] = await Promise.all([
    getInterviewOverviewStats(),
    getRecentInterviews(8),
    getDailyInterviewCounts(14),
    getHiringFunnel(),
    getScoreDistribution(),
  ]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">AI Interviews</h1>
          <p className="text-muted-foreground text-sm">Overview of every job, candidate, and interview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/interviews/jobs">
              <Briefcase className="size-4" aria-hidden="true" />
              Jobs
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/interviews/candidates/invite">
              <UserPlus className="size-4" aria-hidden="true" />
              Invite candidate
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total Candidates" value={stats.totalCandidates} icon={Users} />
        <KpiCard label="Pending Interviews" value={stats.pendingInterviews} icon={Clock} />
        <KpiCard label="Completed Interviews" value={stats.completedInterviews} icon={CheckCircle2} tone="success" />
        <KpiCard
          label="Average Score"
          value={stats.averageScore != null ? `${Math.round(stats.averageScore)}/100` : "-"}
          icon={TrendingUp}
        />
        <KpiCard label="Recommended Candidates" value={stats.recommendedCandidates} icon={ThumbsUp} tone="success" />
        <KpiCard label="Total Jobs Hiring" value={funnel[0]?.value ?? 0} icon={Briefcase} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Daily interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={daily} emptyLabel="No interviews completed in the last 14 days yet." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hiring funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={funnel} emptyLabel="Invite a candidate to start filling the funnel." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={distribution} emptyLabel="No completed interviews have been scored yet." />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent interviews</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState icon={Clock} title="No interviews yet" description="Invited candidates will show up here once they start." />
          ) : (
            <div className="flex flex-col">
              {recent.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/interviews/candidates`}
                  className="border-border hover:bg-accent/50 flex flex-wrap items-center justify-between gap-2 border-b py-3 text-sm last:border-b-0"
                >
                  <div className="flex flex-col">
                    <span className="text-foreground font-medium">{r.candidateName}</span>
                    <span className="text-muted-foreground text-xs">{r.jobTitle}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.overallScore != null && (
                      <span className="text-foreground text-xs tabular-nums">{Math.round(r.overallScore)}/100</span>
                    )}
                    <Badge variant={INTERVIEW_STATUS_VARIANT[r.status]}>{INTERVIEW_STATUS_LABEL[r.status]}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {r.completedAt ? formatDate(r.completedAt) : "In progress"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
