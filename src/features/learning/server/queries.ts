import "server-only";

import { prisma } from "@/lib/prisma";
import type { Module, Lesson, LessonBlock, LessonProgress, Resource, Assessment, LiveSession, AssessmentSubmission } from "@prisma/client";
import { getAccessPolicyForEnrollment } from "@/features/enrollments/server/access-policy";
import { flattenLessons, findNextLesson, isLessonUnlocked } from "../lib/progress";

export type ModuleWithLessons = Module & { lessons: Lesson[] };
export type LessonBlockWithRelations = LessonBlock & {
  resource: Resource | null;
  assessment: Assessment | null;
  liveSession: LiveSession | null;
};

export interface Curriculum {
  learningExperienceId: string;
  title: string;
  modules: ModuleWithLessons[];
  progressByLessonId: Map<string, LessonProgress>;
  nextLesson: Lesson | null;
}

/**
 * The one student-facing curriculum query - always goes through
 * getAccessPolicyForEnrollment (Phase 8's Access Policy), never
 * re-inspects OfferingEnrollment fields itself. Returns null for "no
 * access" and "no curriculum exists" alike - same "don't leak which one"
 * discipline as every ownership-scoped lookup in this codebase.
 */
export async function getCurriculumForEnrollment(
  enrollmentId: string,
  studentId: string
): Promise<Curriculum | null> {
  const policy = await getAccessPolicyForEnrollment(enrollmentId, studentId);
  if (!policy || !policy.canAccessLearning) return null;

  const learningExperience = await prisma.learningExperience.findUnique({
    where: { offeringId: policy.enrollment.offeringId },
    include: { modules: { include: { lessons: true }, orderBy: { order: "asc" } }, offering: true },
  });
  if (!learningExperience) return null;

  const modules = learningExperience.modules.map((m) => ({
    ...m,
    lessons: [...m.lessons].sort((a, b) => a.order - b.order),
  }));

  const progressRows = await prisma.lessonProgress.findMany({ where: { enrollmentId } });
  const progressByLessonId = new Map(progressRows.map((p) => [p.lessonId, p]));

  const orderedLessons = flattenLessons(modules);
  const statusByLessonId = new Map(orderedLessons.map((l) => [l.id, progressByLessonId.get(l.id)?.status ?? "NOT_STARTED"]));
  const nextLesson = findNextLesson(orderedLessons, statusByLessonId);

  return {
    learningExperienceId: learningExperience.id,
    title: learningExperience.title ?? learningExperience.offering.title,
    modules,
    progressByLessonId,
    nextLesson,
  };
}

export interface LessonView {
  lesson: Lesson;
  blocks: LessonBlockWithRelations[];
  progress: LessonProgress | null;
  isUnlocked: boolean;
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  moduleTitle: string;
}

/**
 * Single-lesson view for the Lesson Viewer page - re-derives the same
 * curriculum sequence getCurriculumForEnrollment does (so unlock/prev/next
 * are always consistent with the curriculum nav), then loads that one
 * lesson's blocks with their resource/assessment/liveSession relations.
 * Returns null for "no access", "lesson doesn't belong to this
 * enrollment's curriculum", and "lesson not found" alike.
 */
export async function getLessonForStudent(
  lessonId: string,
  enrollmentId: string,
  studentId: string
): Promise<LessonView | null> {
  const curriculum = await getCurriculumForEnrollment(enrollmentId, studentId);
  if (!curriculum) return null;

  const orderedLessons = flattenLessons(curriculum.modules);
  const index = orderedLessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return null;

  const lesson = orderedLessons[index];
  const previousLesson = index > 0 ? orderedLessons[index - 1] : null;
  const statusByLessonId = new Map(
    orderedLessons.map((l) => [l.id, curriculum.progressByLessonId.get(l.id)?.status ?? "NOT_STARTED"])
  );
  const isUnlocked = isLessonUnlocked(
    lesson,
    previousLesson ?? undefined,
    previousLesson ? statusByLessonId.get(previousLesson.id) : undefined
  );

  const moduleTitle = curriculum.modules.find((m) => m.lessons.some((l) => l.id === lessonId))?.title ?? "";

  const blocks = await prisma.lessonBlock.findMany({
    where: { lessonId },
    include: { resource: true, assessment: true, liveSession: true },
    orderBy: { order: "asc" },
  });

  return {
    lesson,
    blocks,
    progress: curriculum.progressByLessonId.get(lessonId) ?? null,
    isUnlocked,
    previousLesson,
    nextLesson: index < orderedLessons.length - 1 ? orderedLessons[index + 1] : null,
    moduleTitle,
  };
}

/** The student's own attempt at an Assessment, if any - used by the assessment block to show current status/score instead of a blank form every time. */
export async function getSubmissionForAssessment(
  assessmentId: string,
  enrollmentId: string
): Promise<AssessmentSubmission | null> {
  return prisma.assessmentSubmission.findUnique({
    where: { assessmentId_enrollmentId: { assessmentId, enrollmentId } },
  });
}

/** Search within the student's own enrolled curriculum only - never across other students' or other offerings' content. */
export async function searchLessons(enrollmentId: string, studentId: string, query: string): Promise<Lesson[]> {
  const curriculum = await getCurriculumForEnrollment(enrollmentId, studentId);
  if (!curriculum) return [];

  const q = query.trim().toLowerCase();
  if (!q) return [];

  return flattenLessons(curriculum.modules).filter(
    (lesson) => lesson.title.toLowerCase().includes(q) || lesson.summary?.toLowerCase().includes(q)
  );
}
