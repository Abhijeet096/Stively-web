"use server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/cloudinary";
import { createNotifications } from "@/features/notifications/server/creation";

export type IntegrityViolationType = "FULLSCREEN_EXIT" | "TAB_SWITCH";

export type IntegrityViolationResult =
  | { success: true; violationCount: number; terminated: boolean }
  | { success: false; error: string };

const VIOLATION_TERMINATION_THRESHOLD = 2;

/**
 * The Interview Integrity system's one write path for a tab-switch/
 * fullscreen-exit event - server-authoritative, never trusts a
 * client-reported count (a tampered client can only ever report that a
 * violation happened, never how many). Race-safe the same way claimLead
 * (src/features/leads/actions/claim-actions.ts) is: an atomic increment,
 * then a conditional updateMany guarded on status still being IN_PROGRESS
 * before terminating, so two near-simultaneous violation events can't
 * double-terminate. Wrapped in one $transaction so a crash between the
 * increment and the termination write can't leave an interview stuck past
 * the threshold but never actually ended.
 */
export async function logIntegrityViolation(
  interviewId: string,
  type: IntegrityViolationType
): Promise<IntegrityViolationResult> {
  try {
    const outcome = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await tx.interview.findUnique({
        where: { id: interviewId },
        select: { status: true },
      });
      if (!current) {
        return { notFound: true as const };
      }
      // Idempotent: a stale/duplicate client call against an interview
      // already terminated or completed should never double-write.
      if (current.status !== "IN_PROGRESS") {
        return { violationCount: VIOLATION_TERMINATION_THRESHOLD, terminated: true, jobId: null as string | null, candidateName: "" };
      }

      const updated = await tx.interview.update({
        where: { id: interviewId },
        data: { violationCount: { increment: 1 } },
        select: { violationCount: true, linkId: true },
      });

      await tx.interviewActivityLog.create({
        data: { interviewId, type, metadata: { violationCountAfter: updated.violationCount } },
      });

      if (updated.violationCount < VIOLATION_TERMINATION_THRESHOLD) {
        return { violationCount: updated.violationCount, terminated: false, jobId: null as string | null, candidateName: "" };
      }

      const { count } = await tx.interview.updateMany({
        where: { id: interviewId, status: "IN_PROGRESS" },
        data: { status: "ABANDONED", terminatedReason: "INTEGRITY_VIOLATION", completedAt: new Date() },
      });

      let jobId: string | null = null;
      let candidateName = "";
      if (count > 0) {
        await tx.interviewLink.update({ where: { id: updated.linkId }, data: { status: "COMPLETED" } });
        const link = await tx.interviewLink.findUnique({
          where: { id: updated.linkId },
          select: { candidate: { select: { name: true, jobId: true } } },
        });
        jobId = link?.candidate.jobId ?? null;
        candidateName = link?.candidate.name ?? "A candidate";
      }

      return { violationCount: updated.violationCount, terminated: true, jobId, candidateName };
    });

    if ("notFound" in outcome) {
      return { success: false, error: "Interview not found." };
    }

    if (outcome.terminated && outcome.jobId) {
      try {
        await notifyInterviewTerminated(interviewId, outcome.jobId, outcome.candidateName);
      } catch (error) {
        console.error("notifyInterviewTerminated failed:", error);
      }
    }

    return { success: true, violationCount: outcome.violationCount, terminated: outcome.terminated };
  } catch (error) {
    console.error("logIntegrityViolation failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}

/**
 * Notifies whoever created the Job posting (the recruiter responsible for
 * this candidate pipeline) that an interview auto-terminated. Falls back to
 * every ADMIN/SUPER_ADMIN if the job has no recorded creator, so a
 * termination is never silently unnoticed - mirrors notifyLeadClaimed's
 * same fallback reasoning (src/features/leads/server/notify.ts).
 */
async function notifyInterviewTerminated(interviewId: string, jobId: string, candidateName: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { title: true, createdBy: { select: { userId: true } } },
  });
  if (!job) return;

  let recipientUserIds: string[];
  if (job.createdBy?.userId) {
    recipientUserIds = [job.createdBy.userId];
  } else {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    recipientUserIds = admins.map((a) => a.id);
  }
  if (recipientUserIds.length === 0) return;

  await createNotifications(
    recipientUserIds.map((userId) => ({
      userId,
      type: "INTERVIEW_TERMINATED" as const,
      title: "An interview was ended for integrity violations",
      body: `${candidateName}'s interview for ${job.title} was ended after repeated tab-switching/fullscreen violations.`,
      link: `/admin/interviews/candidates/${interviewId}`,
    }))
  );
}

const MAX_RECORDING_BYTES = 80 * 1024 * 1024; // 80MB - generous headroom over the ~35MB a default 20min interview produces at the configured bitrate

export type UploadRecordingResult = { success: true } | { success: false; error: string };

/** Uploads the candidate's webcam recording (normal completion or termination) and attaches its URL to the Interview row. Never blocks the candidate-facing flow - callers treat a failure here as non-fatal. */
export async function uploadInterviewRecording(interviewId: string, formData: FormData): Promise<UploadRecordingResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No recording to upload." };
  }
  if (file.size > MAX_RECORDING_BYTES) {
    return { success: false, error: "Recording is too large." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFile(buffer, "interview-recordings", `interview-${interviewId}.webm`);
    await prisma.interview.update({ where: { id: interviewId }, data: { recordingUrl: uploaded.secureUrl } });
    return { success: true };
  } catch (error) {
    console.error("uploadInterviewRecording failed:", error);
    return { success: false, error: "Upload failed." };
  }
}

/** Logged when recording never started (permission denied, unsupported browser) - so the recruiter report can show *why* there's no recording rather than a silent blank. */
export async function logRecordingUnavailable(interviewId: string, reason: string): Promise<void> {
  try {
    await prisma.interviewActivityLog.create({
      data: { interviewId, type: "RECORDING_UNAVAILABLE", metadata: { reason } },
    });
  } catch (error) {
    console.error("logRecordingUnavailable failed:", error);
  }
}
