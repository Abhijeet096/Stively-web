import "server-only";

import type { InterviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface InterviewOverviewStats {
  totalCandidates: number;
  pendingInterviews: number;
  completedInterviews: number;
  averageScore: number | null;
  recommendedCandidates: number;
}

/** The overview dashboard's six stat cards - every number a real, live query, no fabricated placeholders. */
export async function getInterviewOverviewStats(): Promise<InterviewOverviewStats> {
  const [totalCandidates, completedInterviews, scoreAgg, recommendedCandidates] = await Promise.all([
    prisma.candidate.count(),
    prisma.interview.count({ where: { status: "COMPLETED" } }),
    prisma.score.aggregate({ _avg: { overall: true } }),
    prisma.score.count({ where: { recommendation: { in: ["STRONG_HIRE", "HIRE"] } } }),
  ]);

  return {
    totalCandidates,
    completedInterviews,
    pendingInterviews: Math.max(totalCandidates - completedInterviews, 0),
    averageScore: scoreAgg._avg.overall,
    recommendedCandidates,
  };
}

export interface RecentInterviewRow {
  id: string;
  candidateName: string;
  jobTitle: string;
  status: InterviewStatus;
  completedAt: Date | null;
  overallScore: number | null;
}

/** Most recently completed interviews first, falling back to most recently started for anything still in progress. */
export async function getRecentInterviews(limit = 8): Promise<RecentInterviewRow[]> {
  const interviews = await prisma.interview.findMany({
    orderBy: [{ completedAt: "desc" }, { startedAt: "desc" }],
    take: limit,
    include: {
      link: { include: { candidate: { include: { job: { select: { title: true } } } } } },
      score: { select: { overall: true } },
    },
  });

  return interviews.map((interview) => ({
    id: interview.id,
    candidateName: interview.link.candidate.name,
    jobTitle: interview.link.candidate.job.title,
    status: interview.status,
    completedAt: interview.completedAt,
    overallScore: interview.score?.overall ?? null,
  }));
}

export interface ChartPoint {
  label: string;
  value: number;
}

/** Interviews completed per day, oldest to newest - the "Daily Interviews" chart. */
export async function getDailyInterviewCounts(days = 14): Promise<ChartPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const completed = await prisma.interview.findMany({
    where: { status: "COMPLETED", completedAt: { gte: since } },
    select: { completedAt: true },
  });

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    counts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const { completedAt } of completed) {
    if (!completedAt) continue;
    const key = completedAt.toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([key, value]) => ({
    label: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(key)),
    value,
  }));
}

/** Candidates invited -> interviews started -> interviews completed -> recommended - the "Hiring Funnel" chart. */
export async function getHiringFunnel(): Promise<ChartPoint[]> {
  const [invited, started, completed, recommended] = await Promise.all([
    prisma.candidate.count(),
    prisma.interview.count(),
    prisma.interview.count({ where: { status: "COMPLETED" } }),
    prisma.score.count({ where: { recommendation: { in: ["STRONG_HIRE", "HIRE"] } } }),
  ]);

  return [
    { label: "Invited", value: invited },
    { label: "Started", value: started },
    { label: "Completed", value: completed },
    { label: "Recommended", value: recommended },
  ];
}

const SCORE_BUCKETS: [label: string, min: number, max: number][] = [
  ["0-20", 0, 20],
  ["21-40", 21, 40],
  ["41-60", 41, 60],
  ["61-80", 61, 80],
  ["81-100", 81, 100],
];

/** How completed interviews' overall scores are distributed across five bands - the "Score Distribution" chart. */
export async function getScoreDistribution(): Promise<ChartPoint[]> {
  const scores = await prisma.score.findMany({ select: { overall: true } });

  return SCORE_BUCKETS.map(([label, min, max]) => ({
    label,
    value: scores.filter((s) => s.overall >= min && s.overall <= max).length,
  }));
}
