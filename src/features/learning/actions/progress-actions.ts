"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/actions/leads";
import { recalculateEnrollmentProgress } from "../server/progression";
import { isLessonBlockedByUnpassedQuiz } from "../server/queries";

/**
 * Every action here re-verifies the enrollment belongs to the signed-in
 * student before touching anything - never trusts a client-supplied
 * enrollmentId alone, same discipline as every ownership check built since
 * Phase 5.
 */
async function requireOwnedEnrollment(enrollmentId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const enrollment = await prisma.offeringEnrollment.findFirst({
    where: { id: enrollmentId, studentId: session.user.id },
  });
  return enrollment;
}

function revalidateLearning(enrollmentId: string, lessonId: string) {
  revalidatePath(`/student/learning/${enrollmentId}`);
  revalidatePath(`/student/learning/${enrollmentId}/${lessonId}`);
}

export async function markLessonStarted(enrollmentId: string, lessonId: string): Promise<ActionResult> {
  const enrollment = await requireOwnedEnrollment(enrollmentId);
  if (!enrollment) return { success: false, error: "Not found" };

  try {
    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: { enrollmentId, lessonId, status: "IN_PROGRESS", startedAt: new Date() },
      update: { status: "IN_PROGRESS", startedAt: new Date() },
    });
    return { success: true };
  } catch (error) {
    console.error("markLessonStarted failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}

export async function markLessonComplete(enrollmentId: string, lessonId: string): Promise<ActionResult> {
  const enrollment = await requireOwnedEnrollment(enrollmentId);
  if (!enrollment) return { success: false, error: "Not found" };

  // Re-verified here, not just left to the UI disabling the button - a
  // request straight to this action would otherwise bypass the quiz-pass
  // requirement entirely.
  if (await isLessonBlockedByUnpassedQuiz(lessonId, enrollmentId)) {
    return { success: false, error: "Pass the quiz above before marking this lesson complete." };
  }

  try {
    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: { enrollmentId, lessonId, status: "COMPLETED", startedAt: new Date(), completedAt: new Date() },
      update: { status: "COMPLETED", completedAt: new Date() },
    });
    await recalculateEnrollmentProgress(enrollmentId);
    revalidateLearning(enrollmentId, lessonId);
    return { success: true };
  } catch (error) {
    console.error("markLessonComplete failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}

/** Video resume position - fire-and-forget from the player, so a small failure here should never surface as a user-facing error. */
export async function saveVideoPosition(enrollmentId: string, lessonId: string, positionSeconds: number): Promise<ActionResult> {
  const enrollment = await requireOwnedEnrollment(enrollmentId);
  if (!enrollment) return { success: false, error: "Not found" };

  try {
    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: {
        enrollmentId,
        lessonId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        lastPositionSeconds: positionSeconds,
      },
      update: { lastPositionSeconds: positionSeconds },
    });
    return { success: true };
  } catch (error) {
    console.error("saveVideoPosition failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}
