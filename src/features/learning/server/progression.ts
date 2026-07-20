import "server-only";

import { prisma } from "@/lib/prisma";
import { completeEnrollment } from "@/features/enrollments/server/creation";
import { flattenLessons, findNextLesson, calculateProgressPercentage } from "../lib/progress";

/**
 * The one function that writes OfferingEnrollment.progressPercentage/
 * currentModule (Phase 8's fields, unused until now) - called after every
 * LessonProgress change (see actions/progress-actions.ts). Recomputes from
 * real LessonProgress rows every time rather than incrementing a counter,
 * so it's always correct even if progress rows are edited out of order.
 * At 100%, reuses enrollments' own completeEnrollment() (Phase 8) instead
 * of duplicating that status transition - which is also what makes a
 * student finishing their own curriculum show up on the Operations detail
 * page's EnrollmentOpsCard (Phase 7/8) with zero new integration code.
 */
export async function recalculateEnrollmentProgress(enrollmentId: string): Promise<void> {
  const enrollment = await prisma.offeringEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) return;

  const learningExperience = await prisma.learningExperience.findUnique({
    where: { offeringId: enrollment.offeringId },
    include: { modules: { include: { lessons: true }, orderBy: { order: "asc" } } },
  });
  if (!learningExperience) return;

  const modules = learningExperience.modules.map((m) => ({
    ...m,
    lessons: [...m.lessons].sort((a, b) => a.order - b.order),
  }));
  const orderedLessons = flattenLessons(modules);
  if (orderedLessons.length === 0) return;

  const progressRows = await prisma.lessonProgress.findMany({
    where: { enrollmentId, lessonId: { in: orderedLessons.map((l) => l.id) } },
  });
  const statusByLessonId = new Map(
    orderedLessons.map((l) => [l.id, progressRows.find((p) => p.lessonId === l.id)?.status ?? "NOT_STARTED"])
  );
  const completedCount = [...statusByLessonId.values()].filter((s) => s === "COMPLETED").length;
  const percentage = calculateProgressPercentage(orderedLessons.length, completedCount);

  const next = findNextLesson(orderedLessons, statusByLessonId);
  const currentModuleTitle = next
    ? modules.find((m) => m.lessons.some((l) => l.id === next.id))?.title
    : modules[modules.length - 1]?.title;

  await prisma.offeringEnrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercentage: percentage,
      currentModule: currentModuleTitle ?? enrollment.currentModule,
      progressSnapshots: { create: { progressPercentage: percentage, currentModule: currentModuleTitle } },
      history: { create: { eventType: "PROGRESS_UPDATED", description: `${percentage}% complete` } },
    },
  });

  if (percentage === 100 && enrollment.status !== "COMPLETED") {
    await completeEnrollment(enrollmentId);
  }
}
