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

interface QuizConfigQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * QUIZ (MCQ, auto-gradable) grades itself immediately - straight to GRADED
 * with a real computed score, no human review needed. ASSIGNMENT/PROJECT
 * still just go to SUBMITTED and wait for a real mentor review (that UI is
 * real future work, per the brief's "do not necessarily implement review
 * workflows yet" - unchanged from before). `answers` is a
 * Record<questionIndex, selectedOptionIndex>, matching exactly what
 * AssessmentSubmissionForm sends.
 */
function gradeQuiz(config: unknown, answers: unknown): { score: number; correctCount: number; totalQuestions: number } {
  const questions = ((config as { questions?: QuizConfigQuestion[] } | null)?.questions ?? []) as QuizConfigQuestion[];
  const selected = (answers ?? {}) as Record<number, number>;
  const totalQuestions = questions.length;
  const correctCount = questions.reduce((count, q, index) => (selected[index] === q.correctIndex ? count + 1 : count), 0);
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);
  return { score, correctCount, totalQuestions };
}

export async function submitAssessment(
  assessmentId: string,
  enrollmentId: string,
  input: SubmitAssessmentInput
): Promise<ActionResult> {
  const enrollment = await requireOwnedEnrollment(enrollmentId);
  if (!enrollment) return { success: false, error: "Not found" };

  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return { success: false, error: "Not found" };

    if (assessment.type === "QUIZ") {
      const { score } = gradeQuiz(assessment.config, input.answers);
      await prisma.assessmentSubmission.upsert({
        where: { assessmentId_enrollmentId: { assessmentId, enrollmentId } },
        create: { assessmentId, enrollmentId, status: "GRADED", answers: input.answers as never, score, submittedAt: new Date(), reviewedAt: new Date() },
        update: { status: "GRADED", answers: input.answers as never, score, submittedAt: new Date(), reviewedAt: new Date() },
      });
      return { success: true };
    }

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
