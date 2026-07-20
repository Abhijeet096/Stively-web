"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { createNotification } from "@/features/notifications/server/creation";
import { sendMessageFormSchema } from "../validation/message-schemas";
import { getMentorByUserId, getOrCreateConversation } from "../server/queries";

async function sendMessage(conversationId: string, senderId: string, recipientId: string, content: string, notifyLink: string) {
  await prisma.mentorMessage.create({ data: { conversationId, senderId, content } });
  await prisma.mentorConversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });

  try {
    await createNotification({
      userId: recipientId,
      type: "MESSAGE_RECEIVED",
      title: "New message",
      body: content.length > 120 ? `${content.slice(0, 117)}...` : content,
      link: notifyLink,
    });
  } catch (error) {
    console.error("sendMessage: notification failed:", error);
  }
}

/** Student -> mentor. Creates the conversation on first message if it doesn't exist yet. */
export async function sendMessageToMentor(mentorId: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole("STUDENT");

  const parsed = sendMessageFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const assignment = await prisma.mentorAssignment.findFirst({
      where: { mentorId, studentId: user.id, status: "ACTIVE" },
    });
    if (!assignment) return { success: false, error: "This mentor isn't assigned to you." };

    const conversation = await getOrCreateConversation(mentorId, user.id);
    const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
    if (!mentor) return { success: false, error: "Not found" };

    await sendMessage(conversation.id, user.id, mentor.userId, parsed.data.content, `/mentor/messages/${conversation.id}`);
    revalidatePath(`/student/mentors/${mentorId}`);
    return { success: true };
  } catch (error) {
    console.error("sendMessageToMentor failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Mentor -> student. */
export async function sendMessageToStudent(studentId: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  if (!mentor) return { success: false, error: "Mentor profile not found." };

  const parsed = sendMessageFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const assignment = await prisma.mentorAssignment.findFirst({
      where: { mentorId: mentor.id, studentId, status: "ACTIVE" },
    });
    if (!assignment) return { success: false, error: "This student isn't assigned to you." };

    const conversation = await getOrCreateConversation(mentor.id, studentId);
    await sendMessage(conversation.id, user.id, studentId, parsed.data.content, `/student/mentors/${mentor.id}`);
    revalidatePath(`/mentor/students/${studentId}`);
    revalidatePath(`/mentor/messages/${conversation.id}`);
    return { success: true };
  } catch (error) {
    console.error("sendMessageToStudent failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Thin (studentId/mentorId, content) wrappers around the two actions above -
 * exist so a Server Component can pass a client-callable, string-only
 * `(content) => Promise<ActionResult>` binding down to ConversationPanel
 * via `.bind(null, id)`. Next.js can only serialize a Server Action
 * reference (or a `.bind()` of one) across the server->client boundary, not
 * an arbitrary wrapping closure - this is that boundary-safe wrapper.
 */
export async function sendMessageToMentorContent(mentorId: string, content: string): Promise<ActionResult> {
  return sendMessageToMentor(mentorId, { content });
}
export async function sendMessageToStudentContent(studentId: string, content: string): Promise<ActionResult> {
  return sendMessageToStudent(studentId, { content });
}

/** Marks every unread-by-me message in a conversation as read - called when either side opens the thread. */
export async function markConversationRead(conversationId: string): Promise<ActionResult> {
  const user = await requireUser();

  try {
    const conversation = await prisma.mentorConversation.findFirst({
      where: { id: conversationId, OR: [{ mentor: { userId: user.id } }, { studentId: user.id }] },
    });
    if (!conversation) return { success: false, error: "Not found" };

    await prisma.mentorMessage.updateMany({
      where: { conversationId, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  } catch (error) {
    console.error("markConversationRead failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}
