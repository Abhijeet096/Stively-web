"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/actions/leads";

async function requireOwnedEnrollment(enrollmentId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.offeringEnrollment.findFirst({ where: { id: enrollmentId, studentId: session.user.id } });
}

/**
 * Creates or resumes a student's attempt at an Assessment - same
 * find-or-create shape as offering-requests' getOrCreateDraftRequest, just
 * for assessments instead of the request wizard.
 */
export async function startSubmission(assessmentId: string, enrollmentId: string): Promise<ActionResult> {
  const enrollment = await requireOwnedEnrollment(enrollmentId);
  if (!enrollment) return { success: false, error: "Not found" };

  try {
    await prisma.assessmentSubmission.upsert({
      where: { assessmentId_enrollmentId: { assessmentId, enrollmentId } },
      create: { assessmentId, enrollmentId, status: "IN_PROGRESS" },
      update: {},
    });
    return { success: true };
  } catch (error) {
    console.error("startSubmission failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}

export interface SubmitAssessmentInput {
  answers?: unknown;
  content?: string;
  fileUrl?: string;
}

/**
 * Marks a submission SUBMITTED. Auto-grading (comparing `answers` against
 * Assessment.config's answer key for a QUIZ) and the mentor-review UI for
 * ASSIGNMENT/PROJECT are both real future work on top of this data shape -
 * not built this phase (the brief's explicit "do not necessarily implement
 * review workflows yet").
 */
export async function submitAssessment(
  assessmentId: string,
  enrollmentId: string,
  input: SubmitAssessmentInput
): Promise<ActionResult> {
  const enrollment = await requireOwnedEnrollment(enrollmentId);
  if (!enrollment) return { success: false, error: "Not found" };

  try {
    await prisma.assessmentSubmission.upsert({
      where: { assessmentId_enrollmentId: { assessmentId, enrollmentId } },
      create: {
        assessmentId,
        enrollmentId,
        status: "SUBMITTED",
        answers: input.answers as never,
        content: input.content,
        fileUrl: input.fileUrl,
        submittedAt: new Date(),
      },
      update: {
        status: "SUBMITTED",
        answers: input.answers as never,
        content: input.content,
        fileUrl: input.fileUrl,
        submittedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error) {
    console.error("submitAssessment failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}
