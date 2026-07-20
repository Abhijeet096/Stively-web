"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { Prisma, type LessonBlockType } from "@prisma/client";
import {
  moduleFormSchema,
  lessonFormSchema,
  resourceFormSchema,
  assessmentFormSchema,
  liveSessionFormSchema,
} from "../validation/admin-forms";
import { BLOCK_STORAGE_KIND, parseBlockContent, type ContentBlockType } from "../lib/block-types";

/**
 * Admin curriculum CRUD - real, built UI calls these directly (unlike
 * every prior phase's "unwired admin actions" scaffolding, per this
 * phase's brief explicitly asking for a built content-management
 * experience). Every action still starts with requireRole, same as everything else.
 */

function revalidateExperience(id: string) {
  revalidatePath(`/admin/learning/${id}`);
}

type OrderedSibling = { id: string; order: number };

/** Swaps `order` with the adjacent sibling - simple arrow-button reordering, not a drag-and-drop library. */
function swapWithSibling(siblings: OrderedSibling[], targetId: string, direction: "up" | "down") {
  const sorted = [...siblings].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((s) => s.id === targetId);
  if (index === -1) return null;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= sorted.length) return null;
  return [
    { id: sorted[index].id, order: sorted[swapIndex].order },
    { id: sorted[swapIndex].id, order: sorted[index].order },
  ];
}

// ---------- LearningExperience ----------

export async function createLearningExperience(offeringId: string, title?: string): Promise<ActionResult & { id?: string }> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const experience = await prisma.learningExperience.create({ data: { offeringId, title } });
    revalidatePath("/admin/learning");
    return { success: true, id: experience.id };
  } catch (error) {
    console.error("createLearningExperience failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------- Module ----------

export async function createModule(learningExperienceId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = moduleFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const count = await prisma.module.count({ where: { learningExperienceId } });
    await prisma.module.create({ data: { learningExperienceId, ...parsed.data, order: count } });
    revalidateExperience(learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("createModule failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateModule(moduleId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = moduleFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const module_ = await prisma.module.update({ where: { id: moduleId }, data: parsed.data });
    revalidateExperience(module_.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("updateModule failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deleteModule(moduleId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const module_ = await prisma.module.delete({ where: { id: moduleId } });
    revalidateExperience(module_.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("deleteModule failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function reorderModule(moduleId: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!current) return { success: false, error: "Not found" };
    const siblings = await prisma.module.findMany({
      where: { learningExperienceId: current.learningExperienceId },
      select: { id: true, order: true },
    });
    const swap = swapWithSibling(siblings, moduleId, direction);
    if (!swap) return { success: true }; // already at the edge - no-op, not an error
    await prisma.$transaction(swap.map((s) => prisma.module.update({ where: { id: s.id }, data: { order: s.order } })));
    revalidateExperience(current.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("reorderModule failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------- Lesson ----------

export async function createLesson(moduleId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = lessonFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const [count, module_] = await Promise.all([
      prisma.lesson.count({ where: { moduleId } }),
      prisma.module.findUnique({ where: { id: moduleId } }),
    ]);
    if (!module_) return { success: false, error: "Module not found" };
    await prisma.lesson.create({ data: { moduleId, ...parsed.data, order: count } });
    revalidateExperience(module_.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("createLesson failed:", error);
    return { success: false, error: "This slug is already used in this module." };
  }
}

export async function updateLesson(lessonId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = lessonFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: parsed.data,
      include: { module: true },
    });
    revalidateExperience(lesson.module.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("updateLesson failed:", error);
    return { success: false, error: "This slug is already used in this module." };
  }
}

export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const lesson = await prisma.lesson.delete({ where: { id: lessonId }, include: { module: true } });
    revalidateExperience(lesson.module.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("deleteLesson failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function reorderLesson(lessonId: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
    if (!current) return { success: false, error: "Not found" };
    const siblings = await prisma.lesson.findMany({
      where: { moduleId: current.moduleId },
      select: { id: true, order: true },
    });
    const swap = swapWithSibling(siblings, lessonId, direction);
    if (!swap) return { success: true };
    await prisma.$transaction(swap.map((s) => prisma.lesson.update({ where: { id: s.id }, data: { order: s.order } })));
    revalidateExperience(current.module.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("reorderLesson failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------- LessonBlock ----------

export interface BlockInput {
  type: LessonBlockType;
  title?: string;
  /** Interpreted per BLOCK_STORAGE_KIND[type]: validated content fields for a "content" type, or a resolved id for "resource"/"assessment"/"liveSession" types. */
  payload: Record<string, unknown>;
}

async function resolveBlockData(input: BlockInput): Promise<{ data: Record<string, unknown> } | { error: string }> {
  const kind = BLOCK_STORAGE_KIND[input.type];
  if (kind === "content") {
    const content = parseBlockContent(input.type as ContentBlockType, input.payload);
    if (!content) return { error: "Invalid content for this block type." };
    return { data: { content } };
  }
  if (kind === "resource") {
    if (typeof input.payload.resourceId !== "string") return { error: "Choose a resource." };
    return { data: { resourceId: input.payload.resourceId } };
  }
  if (kind === "assessment") {
    if (typeof input.payload.assessmentId !== "string") return { error: "Choose an assessment." };
    return { data: { assessmentId: input.payload.assessmentId } };
  }
  if (typeof input.payload.liveSessionId !== "string") return { error: "Choose a live session." };
  return { data: { liveSessionId: input.payload.liveSessionId } };
}

export async function createBlock(lessonId: string, input: BlockInput): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const resolved = await resolveBlockData(input);
  if ("error" in resolved) return { success: false, error: resolved.error };

  try {
    const [count, lesson] = await Promise.all([
      prisma.lessonBlock.count({ where: { lessonId } }),
      prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } }),
    ]);
    if (!lesson) return { success: false, error: "Lesson not found" };
    await prisma.lessonBlock.create({
      data: { lessonId, type: input.type, title: input.title, order: count, ...resolved.data },
    });
    revalidateExperience(lesson.module.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("createBlock failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateBlock(blockId: string, input: BlockInput): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const resolved = await resolveBlockData(input);
  if ("error" in resolved) return { success: false, error: resolved.error };

  try {
    const block = await prisma.lessonBlock.update({
      where: { id: blockId },
      data: {
        type: input.type,
        title: input.title,
        content: Prisma.JsonNull,
        resourceId: null,
        assessmentId: null,
        liveSessionId: null,
        ...resolved.data,
      },
      include: { lesson: { include: { module: true } } },
    });
    revalidateExperience(block.lesson.module.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("updateBlock failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deleteBlock(blockId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const block = await prisma.lessonBlock.delete({
      where: { id: blockId },
      include: { lesson: { include: { module: true } } },
    });
    revalidateExperience(block.lesson.module.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("deleteBlock failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function reorderBlock(blockId: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.lessonBlock.findUnique({
      where: { id: blockId },
      include: { lesson: { include: { module: true } } },
    });
    if (!current) return { success: false, error: "Not found" };
    const siblings = await prisma.lessonBlock.findMany({
      where: { lessonId: current.lessonId },
      select: { id: true, order: true },
    });
    const swap = swapWithSibling(siblings, blockId, direction);
    if (!swap) return { success: true };
    await prisma.$transaction(swap.map((s) => prisma.lessonBlock.update({ where: { id: s.id }, data: { order: s.order } })));
    revalidateExperience(current.lesson.module.learningExperienceId);
    return { success: true };
  } catch (error) {
    console.error("reorderBlock failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------- Reusable Resource / Assessment / LiveSession creation ----------
// Deliberately separate from block creation - a Resource/Assessment/
// LiveSession is created once and attached from many blocks, never
// duplicated per block (the brief's explicit reusable-resource requirement).

export async function createResource(input: unknown): Promise<ActionResult & { id?: string }> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = resourceFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const resource = await prisma.resource.create({ data: parsed.data });
    revalidatePath("/admin/learning");
    return { success: true, id: resource.id };
  } catch (error) {
    console.error("createResource failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function createAssessment(input: unknown): Promise<ActionResult & { id?: string }> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = assessmentFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const assessment = await prisma.assessment.create({ data: parsed.data });
    revalidatePath("/admin/learning");
    return { success: true, id: assessment.id };
  } catch (error) {
    console.error("createAssessment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function createLiveSession(learningExperienceId: string, input: unknown): Promise<ActionResult & { id?: string }> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = liveSessionFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const session = await prisma.liveSession.create({
      data: {
        learningExperienceId,
        title: parsed.data.title,
        scheduledAt: new Date(parsed.data.scheduledAt),
        durationMinutes: parsed.data.durationMinutes,
        meetingUrl: parsed.data.meetingUrl || undefined,
      },
    });
    revalidateExperience(learningExperienceId);
    return { success: true, id: session.id };
  } catch (error) {
    console.error("createLiveSession failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
