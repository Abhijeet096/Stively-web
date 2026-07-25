"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { siteConfig } from "@/config/site";
import type { ActionResult } from "@/actions/leads";
import { generateInterviewToken, computeExpiryDate } from "@/features/interviews/lib/token";
import { inviteCandidateSchema } from "../validation/invite-schema";

export type InviteCandidateResult = ActionResult & { url?: string; reused?: boolean };

/**
 * Creates (or reuses) a Candidate for this job, then issues an interview
 * link. If the candidate already has a still-valid, not-yet-completed link
 * for this exact job, that link is returned instead of minting a new one -
 * the brief's "prevent duplicate interview" requirement, satisfied by never
 * letting two simultaneously-active links exist for the same candidate+job
 * rather than by a separate guard check at interview-start time.
 */
export async function inviteCandidate(input: unknown): Promise<InviteCandidateResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = inviteCandidateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const job = await prisma.job.findUnique({ where: { id: data.jobId }, select: { id: true } });
    if (!job) return { success: false, error: "Job not found." };

    const candidate = await prisma.candidate.upsert({
      where: { email_jobId: { email: data.email, jobId: data.jobId } },
      update: { name: data.name, phone: data.phone },
      create: { name: data.name, email: data.email, phone: data.phone, jobId: data.jobId },
    });

    const existingActiveLink = await prisma.interviewLink.findFirst({
      where: {
        candidateId: candidate.id,
        expiresAt: { gt: new Date() },
        status: { in: ["PENDING", "SENT", "OPENED", "IN_PROGRESS"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingActiveLink) {
      revalidatePath("/admin/interviews/candidates");
      return {
        success: true,
        url: `${siteConfig.url}/interview/${existingActiveLink.token}`,
        reused: true,
      };
    }

    const link = await prisma.interviewLink.create({
      data: {
        candidateId: candidate.id,
        token: generateInterviewToken(),
        expiresAt: computeExpiryDate(data.expiryDays),
      },
    });

    revalidatePath("/admin/interviews/candidates");
    return { success: true, url: `${siteConfig.url}/interview/${link.token}` };
  } catch (error) {
    console.error("inviteCandidate failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
