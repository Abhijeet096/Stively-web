import { z } from "zod";
import { LessonBlockType, ResourceType, AssessmentType } from "@prisma/client";

export const moduleFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
});
export type ModuleFormInput = z.infer<typeof moduleFormSchema>;

export const lessonFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  summary: z.string().trim().optional(),
  estimatedMinutes: z.coerce.number().int().positive().optional(),
  isPreviewable: z.boolean().default(false),
  requiresPreviousCompletion: z.boolean().default(true),
});
export type LessonFormInput = z.infer<typeof lessonFormSchema>;

export const blockFormSchema = z.object({
  type: z.nativeEnum(LessonBlockType),
  title: z.string().trim().optional(),
  // Interpreted per BLOCK_STORAGE_KIND[type] in the action - a raw record here,
  // narrowed/validated against the right shape (content schema, or an id
  // reference) once the type is known.
  payload: z.record(z.string(), z.unknown()),
});
export type BlockFormInput = z.infer<typeof blockFormSchema>;

export const resourceFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  type: z.nativeEnum(ResourceType),
  url: z.string().trim().url("Enter a valid URL"),
  fileSize: z.coerce.number().int().positive().optional(),
  mimeType: z.string().trim().optional(),
});
export type ResourceFormInput = z.infer<typeof resourceFormSchema>;

export const assessmentFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  type: z.nativeEnum(AssessmentType),
  instructions: z.string().trim().optional(),
  passingScore: z.coerce.number().int().min(0).max(100).optional(),
});
export type AssessmentFormInput = z.infer<typeof assessmentFormSchema>;

export const liveSessionFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  scheduledAt: z.string().trim().min(1, "Choose a date and time"),
  durationMinutes: z.coerce.number().int().positive().optional(),
  meetingUrl: z.string().trim().url().optional().or(z.literal("")),
});
export type LiveSessionFormInput = z.infer<typeof liveSessionFormSchema>;
