import "server-only";

import { prisma } from "@/lib/prisma";
import type { Module, Lesson, LessonBlock, LessonBlockType, LessonProgress, Resource, Assessment, LiveSession, AssessmentSubmission, AiTutorMessage } from "@prisma/client";
import { getAccessPolicyForEnrollment } from "@/features/enrollments/server/access-policy";
import { flattenLessons, findNextLesson, isLessonUnlocked, calculateProgressPercentage } from "../lib/progress";
import { AI_TUTOR_DAILY_MESSAGE_LIMIT, startOfTodayUtc } from "../lib/ai-tutor";

export type ModuleWithLessons = Module & { lessons: Lesson[] };
export type LessonBlockWithRelations = LessonBlock & {
  resource: Resource | null;
  assessment: Assessment | null;
  liveSession: LiveSession | null;
};

/**
 * One navigable entry in the course player's sidebar - a single LessonBlock
 * (the video, the reading, the quiz), not a whole lesson. The learner
 * navigates block by block, so the sidebar mirrors exactly what the main
 * area can show. Deliberately a projection of existing LessonBlock rows
 * rather than a new model.
 */
export interface CurriculumItem {
  id: string;
  lessonId: string;
  type: LessonBlockType;
  title: string;
  order: number;
  /**
   * Quiz items carry their own real state, read from this enrollment's
   * AssessmentSubmission - a passed quiz stays ticked even before the
   * lesson itself is marked complete. Undefined for every non-quiz item,
   * which inherits the lesson's own LessonProgress instead.
   */
  quizPassed?: boolean;
}

export interface Curriculum {
  learningExperienceId: string;
  title: string;
  modules: ModuleWithLessons[];
  progressByLessonId: Map<string, LessonProgress>;
  /** Sidebar items per lesson, ordered - see CurriculumItem. */
  itemsByLessonId: Map<string, CurriculumItem[]>;
  nextLesson: Lesson | null;
  totalLessons: number;
  completedLessons: number;
  /** Real completion percentage from LessonProgress rows - never a static or estimated figure. */
  progressPercentage: number;
}

/** Fallback label for a block with no title of its own, so the sidebar never shows a blank row. */
const BLOCK_TYPE_LABEL: Partial<Record<LessonBlockType, string>> = {
  VIDEO: "Video lesson",
  MARKDOWN: "Reading material",
  RICH_TEXT: "Reading material",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  PROJECT: "Project",
  AI_CONVERSATION: "Ask the AI Tutor",
  PDF: "PDF",
  SLIDES: "Slides",
  DOWNLOAD: "Download",
  EXTERNAL_LINK: "Link",
  EMBED: "Embed",
  CODE: "Code",
  LIVE_SESSION: "Live session",
};

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

  // Sidebar items: every block across the whole curriculum in one query,
  // plus this enrollment's quiz results so a passed quiz can show its own
  // tick independently of whether the lesson was marked complete.
  const blocks = await prisma.lessonBlock.findMany({
    where: { lessonId: { in: orderedLessons.map((l) => l.id) } },
    orderBy: { order: "asc" },
    select: {
      id: true,
      lessonId: true,
      type: true,
      title: true,
      order: true,
      assessmentId: true,
      assessment: { select: { passingScore: true } },
    },
  });

  const quizAssessmentIds = blocks
    .filter((b) => b.type === "QUIZ" && b.assessmentId)
    .map((b) => b.assessmentId as string);
  const submissions = quizAssessmentIds.length
    ? await prisma.assessmentSubmission.findMany({
        where: { enrollmentId, assessmentId: { in: quizAssessmentIds } },
        select: { assessmentId: true, score: true },
      })
    : [];
  const scoreByAssessmentId = new Map(submissions.map((s) => [s.assessmentId, s.score ?? 0]));

  const itemsByLessonId = new Map<string, CurriculumItem[]>();
  for (const block of blocks) {
    const item: CurriculumItem = {
      id: block.id,
      lessonId: block.lessonId,
      type: block.type,
      title: block.title?.trim() || BLOCK_TYPE_LABEL[block.type] || "Lesson content",
      order: block.order,
      ...(block.type === "QUIZ" && block.assessmentId
        ? {
            quizPassed:
              (scoreByAssessmentId.get(block.assessmentId) ?? -1) >= (block.assessment?.passingScore ?? 0) &&
              scoreByAssessmentId.has(block.assessmentId),
          }
        : {}),
    };
    const list = itemsByLessonId.get(block.lessonId);
    if (list) list.push(item);
    else itemsByLessonId.set(block.lessonId, [item]);
  }

  const completedLessons = orderedLessons.filter((l) => statusByLessonId.get(l.id) === "COMPLETED").length;

  return {
    learningExperienceId: learningExperience.id,
    title: learningExperience.title ?? learningExperience.offering.title,
    modules,
    progressByLessonId,
    itemsByLessonId,
    nextLesson,
    totalLessons: orderedLessons.length,
    completedLessons,
    progressPercentage: calculateProgressPercentage(orderedLessons.length, completedLessons),
  };
}

/**
 * True if this lesson has a QUIZ block that hasn't been passed yet
 * (score >= Assessment.passingScore, default 0 - i.e. no minimum means
 * never blocking) - the real enforcement point behind "must pass the quiz
 * to unlock the next lesson." Called from both getLessonForStudent (to
 * disable "Mark as complete" in the UI) and markLessonComplete (to
 * re-verify server-side - a disabled button is not real enforcement on its
 * own). `blocks` can be passed in when the caller already has them
 * (avoids a duplicate query); omitted, it fetches them itself.
 */
export async function isLessonBlockedByUnpassedQuiz(
  lessonId: string,
  enrollmentId: string,
  blocks?: (Pick<LessonBlock, "type"> & { assessment?: Assessment | null })[]
): Promise<boolean> {
  const quizBlocks =
    blocks ?? (await prisma.lessonBlock.findMany({ where: { lessonId, type: "QUIZ" }, include: { assessment: true } }));
  const quizAssessments = quizBlocks
    .filter((b) => b.type === "QUIZ" && !!b.assessment)
    .map((b) => b.assessment as Assessment);
  if (quizAssessments.length === 0) return false;

  const assessmentIds = quizAssessments.map((a) => a.id);
  const submissions = await prisma.assessmentSubmission.findMany({
    where: { enrollmentId, assessmentId: { in: assessmentIds } },
    select: { assessmentId: true, score: true },
  });
  const scoreByAssessmentId = new Map(submissions.map((s) => [s.assessmentId, s.score ?? 0]));

  return quizAssessments.some((a) => (scoreByAssessmentId.get(a.id) ?? 0) < (a.passingScore ?? 0));
}

export interface LessonView {
  lesson: Lesson;
  blocks: LessonBlockWithRelations[];
  progress: LessonProgress | null;
  isUnlocked: boolean;
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  moduleTitle: string;
  /** True if this lesson has at least one QUIZ block that hasn't been passed yet (score >= Assessment.passingScore) - blocks "Mark as complete" until the student actually passes, not just attempts, the quiz. A lesson with no QUIZ block is never blocked. */
  blockedByUnpassedQuiz: boolean;
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
    blockedByUnpassedQuiz: await isLessonBlockedByUnpassedQuiz(lessonId, enrollmentId, blocks),
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

export interface AiTutorConversationState {
  messages: Pick<AiTutorMessage, "id" | "role" | "content" | "createdAt">[];
  remainingToday: number;
  dailyLimit: number;
}

/**
 * Loads a student's existing AI Tutor conversation on one lesson, plus
 * today's remaining quota - powers the chat block's initial server render
 * (same async-Server-Component pattern as BlockAssessment/
 * getSubmissionForAssessment above), so a returning student sees their
 * prior conversation with no client-side fetch/flicker. Re-verifies access
 * via getLessonForStudent rather than trusting the caller already did -
 * this can be called directly, not just from a rendered block.
 */
export async function getAiTutorConversation(
  enrollmentId: string,
  lessonId: string,
  studentId: string
): Promise<AiTutorConversationState | null> {
  const lessonView = await getLessonForStudent(lessonId, enrollmentId, studentId);
  if (!lessonView) return null;

  const since = startOfTodayUtc();
  const [messages, usedToday] = await Promise.all([
    prisma.aiTutorMessage.findMany({
      where: { studentId, lessonId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, createdAt: true },
    }),
    prisma.aiTutorMessage.count({ where: { studentId, role: "USER", createdAt: { gte: since } } }),
  ]);

  return {
    messages,
    remainingToday: Math.max(0, AI_TUTOR_DAILY_MESSAGE_LIMIT - usedToday),
    dailyLimit: AI_TUTOR_DAILY_MESSAGE_LIMIT,
  };
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
