import { prisma } from "@/lib/prisma";
import type { Job, InterviewTemplate } from "@prisma/client";

export type JobWithTemplate = Job & { template: InterviewTemplate };
export type JobWithCounts = JobWithTemplate & { _count: { candidates: number } };

/** Admin job list, newest first - every status included, filtering (if any) happens client-side over this small dataset. */
export async function getAllJobs(): Promise<JobWithCounts[]> {
  return prisma.job.findMany({
    include: { template: true, _count: { select: { candidates: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobById(id: string): Promise<JobWithTemplate | null> {
  return prisma.job.findUnique({
    where: { id },
    include: { template: true },
  });
}

export async function getAllInterviewTemplates(): Promise<InterviewTemplate[]> {
  return prisma.interviewTemplate.findMany({ orderBy: { name: "asc" } });
}
