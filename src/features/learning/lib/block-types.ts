import {
  AlignLeft,
  FileText,
  Video,
  File,
  Presentation,
  Link as LinkIcon,
  LayoutTemplate,
  Code2,
  Radio,
  ClipboardList,
  FolderKanban,
  HelpCircle,
  Sparkles,
  Download,
  type LucideIcon,
} from "lucide-react";
import { z } from "zod";
import type { LessonBlockType } from "@prisma/client";

export const BLOCK_TYPE_LABEL: Record<LessonBlockType, string> = {
  RICH_TEXT: "Rich text",
  MARKDOWN: "Markdown",
  VIDEO: "Video",
  PDF: "PDF",
  SLIDES: "Slides",
  EXTERNAL_LINK: "External link",
  EMBED: "Embed",
  CODE: "Code example",
  LIVE_SESSION: "Live session",
  ASSIGNMENT: "Assignment",
  PROJECT: "Project",
  QUIZ: "Quiz",
  AI_CONVERSATION: "AI conversation",
  DOWNLOAD: "Download",
};

export const BLOCK_TYPE_ICON: Record<LessonBlockType, LucideIcon> = {
  RICH_TEXT: AlignLeft,
  MARKDOWN: FileText,
  VIDEO: Video,
  PDF: File,
  SLIDES: Presentation,
  EXTERNAL_LINK: LinkIcon,
  EMBED: LayoutTemplate,
  CODE: Code2,
  LIVE_SESSION: Radio,
  ASSIGNMENT: ClipboardList,
  PROJECT: FolderKanban,
  QUIZ: HelpCircle,
  AI_CONVERSATION: Sparkles,
  DOWNLOAD: Download,
};

export type BlockStorageKind = "content" | "resource" | "assessment" | "liveSession";

/**
 * Which storage a block type actually uses - the application-layer rule
 * behind the schema's `content: Json` vs `resourceId`/`assessmentId`/
 * `liveSessionId` split (see LessonBlock's comment in schema.prisma).
 * PDF/SLIDES/DOWNLOAD go through Resource specifically because the brief
 * requires reusable, non-duplicated files/metadata - a VIDEO's URL or an
 * EXTERNAL_LINK isn't "a file" in that sense, so those stay simple content.
 */
export const BLOCK_STORAGE_KIND: Record<LessonBlockType, BlockStorageKind> = {
  RICH_TEXT: "content",
  MARKDOWN: "content",
  VIDEO: "content",
  EXTERNAL_LINK: "content",
  EMBED: "content",
  CODE: "content",
  AI_CONVERSATION: "content",
  PDF: "resource",
  SLIDES: "resource",
  DOWNLOAD: "resource",
  QUIZ: "assessment",
  ASSIGNMENT: "assessment",
  PROJECT: "assessment",
  LIVE_SESSION: "liveSession",
};

export const richTextContentSchema = z.object({ text: z.string().trim().min(1) });
export const markdownContentSchema = z.object({ text: z.string().trim().min(1) });
export const videoContentSchema = z.object({
  url: z.string().trim().url(),
  provider: z.enum(["youtube", "vimeo", "mux", "file"]).optional(),
  durationSeconds: z.number().int().positive().optional(),
});
export const externalLinkContentSchema = z.object({
  url: z.string().trim().url(),
  description: z.string().trim().optional(),
});
export const embedContentSchema = z.object({ url: z.string().trim().url() });
export const codeContentSchema = z.object({
  language: z.string().trim().min(1),
  snippet: z.string().min(1),
});
/** Config, not a transcript - the future AI tutor's starting context. No conversation is ever generated or stored this phase. */
export const aiConversationContentSchema = z.object({ systemPrompt: z.string().trim().optional() });

const CONTENT_SCHEMA_BY_TYPE = {
  RICH_TEXT: richTextContentSchema,
  MARKDOWN: markdownContentSchema,
  VIDEO: videoContentSchema,
  EXTERNAL_LINK: externalLinkContentSchema,
  EMBED: embedContentSchema,
  CODE: codeContentSchema,
  AI_CONVERSATION: aiConversationContentSchema,
} as const;

export type ContentBlockType = keyof typeof CONTENT_SCHEMA_BY_TYPE;

/** Parses+validates a Json-content block's payload for its type - returns null (never throws) if malformed, same "omit, don't crash" discipline as parseOfferingFaqs/parseSyllabus. */
export function parseBlockContent(type: LessonBlockType, value: unknown) {
  const schema = CONTENT_SCHEMA_BY_TYPE[type as ContentBlockType];
  if (!schema) return null;
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}
