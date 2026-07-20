import type { LessonProgressStatus } from "@prisma/client";

export interface LessonLike {
  id: string;
  order: number;
  requiresPreviousCompletion: boolean;
  unlocksAt: Date | null;
}

export interface ModuleLike<TLesson extends LessonLike = LessonLike> {
  id: string;
  order: number;
  lessons: TLesson[];
}

/** Every module's lessons, in module order then lesson order - the one canonical "curriculum sequence" every progression/unlock decision walks. */
export function flattenLessons<TLesson extends LessonLike>(modules: ModuleLike<TLesson>[]): TLesson[] {
  return [...modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((module) => [...module.lessons].sort((a, b) => a.order - b.order));
}

export function calculateProgressPercentage(totalLessons: number, completedLessons: number): number {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}

/**
 * Simple linear gating: a lesson that requires the previous one needs that
 * previous lesson (in flattened curriculum order) marked COMPLETED. The
 * very first lesson, and any lesson with `requiresPreviousCompletion:
 * false`, only checks `unlocksAt`. Deliberately not a prerequisite graph -
 * see LessonBlock's schema comment for why.
 */
export function isLessonUnlocked(
  lesson: LessonLike,
  previousLesson: LessonLike | undefined,
  previousLessonStatus: LessonProgressStatus | undefined
): boolean {
  const timeGateOpen = !lesson.unlocksAt || lesson.unlocksAt <= new Date();
  if (!timeGateOpen) return false;
  if (!lesson.requiresPreviousCompletion || !previousLesson) return true;
  return previousLessonStatus === "COMPLETED";
}

/** The lesson "Continue learning" should open - the first not-yet-completed lesson in curriculum order, or null once everything is done. */
export function findNextLesson<TLesson extends LessonLike>(
  orderedLessons: TLesson[],
  statusByLessonId: Map<string, LessonProgressStatus>
): TLesson | null {
  return orderedLessons.find((lesson) => statusByLessonId.get(lesson.id) !== "COMPLETED") ?? null;
}
