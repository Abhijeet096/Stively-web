"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import type { LiveSessionStatus } from "@prisma/client";
import { createNotification } from "@/features/notifications/server/creation";
import { mentorSessionFormSchema } from "../validation/session-schemas";
import { getMentorByUserId } from "../server/queries";

/**
 * Creates a mentor-led LiveSession (1:1, office hours, group mentoring) -
 * the same model Phase 9's curriculum classes use, generalized rather than
 * forked (see prisma/schema.prisma's LiveSession comment). Attendees are
 * filtered down to this mentor's own actively-assigned students - a mentor
 * can never invite a student who isn't theirs, even if a client sent an
 * arbitrary id.
 */
export async function createMentorSession(input: unknown): Promise<ActionResult & { id?: string }> {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  if (!mentor) return { success: false, error: "Mentor profile not found." };

  const parsed = mentorSessionFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const assignments = await prisma.mentorAssignment.findMany({
      where: { mentorId: mentor.id, status: "ACTIVE", studentId: { in: data.attendeeStudentIds } },
      select: { studentId: true },
    });
    const validStudentIds = assignments.map((a) => a.studentId);
    if (validStudentIds.length === 0) return { success: false, error: "None of the selected students are assigned to you." };

    const session = await prisma.liveSession.create({
      data: {
        sessionType: data.sessionType,
        provider: data.provider,
        title: data.title,
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes,
        meetingUrl: data.meetingUrl || undefined,
        mentorId: mentor.id,
        attendees: { create: validStudentIds.map((studentId) => ({ studentId })) },
      },
    });

    try {
      await Promise.allSettled(
        validStudentIds.map((studentId) =>
          createNotification({
            userId: studentId,
            type: "SESSION_SCHEDULED",
            title: `New session: ${data.title}`,
            body: `Scheduled for ${new Date(data.scheduledAt).toLocaleString()}.`,
            link: `/student/mentors/${mentor.id}`,
          })
        )
      );
    } catch (error) {
      console.error("createMentorSession: notification failed:", error);
    }

    revalidatePath("/mentor/sessions");
    return { success: true, id: session.id };
  } catch (error) {
    console.error("createMentorSession failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateSessionStatus(sessionId: string, status: LiveSessionStatus): Promise<ActionResult> {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  if (!mentor) return { success: false, error: "Mentor profile not found." };

  try {
    const session = await prisma.liveSession.findFirst({ where: { id: sessionId, mentorId: mentor.id } });
    if (!session) return { success: false, error: "Not found" };

    await prisma.liveSession.update({ where: { id: sessionId }, data: { status } });
    revalidatePath("/mentor/sessions");
    revalidatePath(`/mentor/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("updateSessionStatus failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
