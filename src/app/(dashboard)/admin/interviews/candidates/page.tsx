import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import type { InterviewStatus, Recommendation } from "@prisma/client";

import { getCandidatesForReview } from "@/features/candidates/server/queries";
import { getAllJobs } from "@/features/jobs/server/queries";
import { CandidateList } from "@/features/candidates/components/admin/candidate-list";
import { CandidateFiltersToolbar } from "@/features/candidates/components/admin/candidate-filters-toolbar";
import { Button } from "@/components/ui/button";

interface CandidatesPageProps {
  searchParams: Promise<{ jobId?: string; status?: string; recommendation?: string; q?: string }>;
}

export const metadata: Metadata = { title: "Candidates" };

export default async function CandidatesPage({ searchParams }: CandidatesPageProps) {
  const { jobId, status, recommendation, q } = await searchParams;

  const [candidates, jobs] = await Promise.all([
    getCandidatesForReview({
      jobId,
      status: status as InterviewStatus | undefined,
      recommendation: recommendation as Recommendation | undefined,
      search: q,
    }),
    getAllJobs(),
  ]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground text-sm">Everyone invited to interview, across every job.</p>
        </div>
        <Button asChild>
          <Link href={jobId ? `/admin/interviews/candidates/invite?jobId=${jobId}` : "/admin/interviews/candidates/invite"}>
            <UserPlus className="size-4" aria-hidden="true" />
            Invite candidate
          </Link>
        </Button>
      </div>

      <CandidateFiltersToolbar jobs={jobs.map((job) => ({ id: job.id, title: job.title }))} />

      <CandidateList candidates={candidates} />
    </div>
  );
}
