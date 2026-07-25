"use server";

import { revalidatePath } from "next/cache";
import type { JobStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { jobFormSchema, jobStatusSchema } from "../validation/job-schemas";

/** Same "prefer the TeamMember linked to the signed-in User, fall back to undefined" pattern as Operations/Leads - see operation-actions.ts's resolveActorTeamMemberId for the precedent this mirrors. */
async function resolveActorTeamMemberId(): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return undefined;
  const teamMember = await prisma.teamMember.findUnique({ where: { userId: session.user.id } });
  return teamMember?.id;
}

function revalidateJobs(id?: string) {
  revalidatePath("/admin/interviews/jobs");
  if (id) revalidatePath(`/admin/interviews/jobs/${id}`);
}

export async function createJob(input: unknown): Promise<ActionResult & { id?: string }> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = jobFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const createdById = await resolveActorTeamMemberId();
    const job = await prisma.job.create({
      data: { ...parsed.data, createdById },
    });
    revalidateJobs();
    return { success: true, id: job.id };
  } catch (error) {
    console.error("createJob failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateJob(jobId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = jobFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await prisma.job.update({ where: { id: jobId }, data: parsed.data });
    revalidateJobs(jobId);
    return { success: true };
  } catch (error) {
    console.error("updateJob failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function setJobStatus(jobId: string, status: JobStatus): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = jobStatusSchema.safeParse({ status });
  if (!parsed.success) return { success: false, error: "Invalid status" };

  try {
    await prisma.job.update({ where: { id: jobId }, data: { status: parsed.data.status } });
    revalidateJobs(jobId);
    return { success: true };
  } catch (error) {
    console.error("setJobStatus failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Hard delete - only safe while a job has no candidates yet (Job.onDelete
 * for Candidate is Cascade, so this WOULD silently wipe an entire
 * candidate/interview history if allowed unconditionally). Archiving
 * (setJobStatus to ARCHIVED) is the correct action once real candidates
 * exist; this is for cleaning up a job created by mistake.
 */
export async function deleteJob(jobId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  try {
    const candidateCount = await prisma.candidate.count({ where: { jobId } });
    if (candidateCount > 0) {
      return {
        success: false,
        error: "This job has candidates attached - archive it instead of deleting.",
      };
    }
    await prisma.job.delete({ where: { id: jobId } });
    revalidateJobs();
    return { success: true };
  } catch (error) {
    console.error("deleteJob failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
