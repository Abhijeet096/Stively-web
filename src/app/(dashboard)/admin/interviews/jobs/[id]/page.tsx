import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getJobById } from "@/features/jobs/server/queries";
import { JobDetail } from "@/features/jobs/components/admin/job-detail";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  return { title: job?.title ?? "Job" };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const [job, candidateCount] = await Promise.all([
    getJobById(id),
    prisma.candidate.count({ where: { jobId: id } }),
  ]);
  if (!job) notFound();

  return (
    <div className="p-6">
      <JobDetail job={job} candidateCount={candidateCount} />
    </div>
  );
}
