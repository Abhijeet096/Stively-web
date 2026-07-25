import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { getAllJobs } from "@/features/jobs/server/queries";
import { JobList } from "@/features/jobs/components/admin/job-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Jobs" };

export default async function AdminJobsPage() {
  const jobs = await getAllJobs();

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground text-sm">Open roles candidates can be interviewed for.</p>
        </div>
        <Button asChild>
          <Link href="/admin/interviews/jobs/new">
            <Plus className="size-4" aria-hidden="true" />
            New job
          </Link>
        </Button>
      </div>

      <JobList jobs={jobs} />
    </div>
  );
}
