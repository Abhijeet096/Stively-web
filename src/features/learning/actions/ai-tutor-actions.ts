"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/actions/leads";
import { sendAiTutorMessageSchema } from "../validation/ai-tutor-schemas";
import { getLessonForStudent } from "../server/queries";
import { answerLessonQuestion } from "../server/ai-tutor-engine";
import { AI_TUTOR_DAILY_MESSAGE_LIMIT, AI_TUTOR_HISTORY_TURNS, startOfTodayUtc } from "../lib/ai-tutor";

export type SendAiTutorMessageResult = ActionResult & { reply?: string; remainingToday?: number };

/**
 * The one entry point for a student's AI Tutor question - re-verifies
 * ownership, real granted access, AND lesson unlock status via
 * getLessonForStudent (never trusts that the chat panel only rendered
 * because the block itself was visible - same "never trust the client"
 * discipline LessonPage's own comment states explicitly), then enforces
 * the daily cap before ever calling Groq.
 */
export async function sendAiTutorMessage(input: unknown): Promise<SendAiTutorMessageResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in." };

  const parsed = sendAiTutorMessageSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { enrollmentId, lessonId, question } = parsed.data;

  const studentId = session.user.id;

  const lessonView = await getLessonForStudent(lessonId, enrollmentId, studentId);
  if (!lessonView) return { success: false, error: "Lesson not found." };
  if (!lessonView.isUnlocked) return { success: false, error: "This lesson isn't unlocked yet." };

  try {
    const since = startOfTodayUtc();
    const usedToday = await prisma.aiTutorMessage.count({
      where: { studentId, role: "USER", createdAt: { gte: since } },
    });
    if (usedToday >= AI_TUTOR_DAILY_MESSAGE_LIMIT) {
      return { success: false, error: `You've reached today's limit of ${AI_TUTOR_DAILY_MESSAGE_LIMIT} tutor questions. Try again tomorrow.` };
    }

    const history = await prisma.aiTutorMessage.findMany({
      where: { studentId, lessonId },
      orderBy: { createdAt: "desc" },
      take: AI_TUTOR_HISTORY_TURNS,
      select: { role: true, content: true },
    });
    history.reverse();

    const reply = await answerLessonQuestion(lessonView.lesson, lessonView.moduleTitle, lessonView.blocks, history, question);

    await prisma.$transaction([
      prisma.aiTutorMessage.create({ data: { studentId, lessonId, role: "USER", content: question } }),
      prisma.aiTutorMessage.create({ data: { studentId, lessonId, role: "ASSISTANT", content: reply } }),
    ]);

    return { success: true, reply, remainingToday: AI_TUTOR_DAILY_MESSAGE_LIMIT - usedToday - 1 };
  } catch (error) {
    console.error("sendAiTutorMessage failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

