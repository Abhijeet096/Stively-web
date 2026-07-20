"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { createNotifications } from "@/features/notifications/server/creation";
import { announcementFormSchema } from "../validation/announcement-schemas";
import { getMentorByUserId, getMyAssignedStudents } from "../server/queries";

/** Broadcasts to every currently-assigned student - fans out one Notification per student, no per-student read-tracking table needed (read state lives on Notification). */
export async function createAnnouncement(input: unknown): Promise<ActionResult> {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  if (!mentor) return { success: false, error: "Mentor profile not found." };

  const parsed = announcementFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    await prisma.mentorAnnouncement.create({
      data: { mentorId: mentor.id, title: data.title, content: data.content },
    });

    const students = await getMyAssignedStudents(mentor.id);
    await createNotifications(
      students.map((assignment) => ({
        userId: assignment.studentId,
        type: "MENTOR_ANNOUNCEMENT" as const,
        title: data.title,
        body: data.content.length > 140 ? `${data.content.slice(0, 137)}...` : data.content,
        link: `/student/mentors/${mentor.id}`,
      }))
    );

    revalidatePath("/mentor/announcements");
    return { success: true };
  } catch (error) {
    console.error("createAnnouncement failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
