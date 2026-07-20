import "server-only";

import { prisma } from "@/lib/prisma";
import type { MentorAssignment } from "@prisma/client";
import { createNotification } from "@/features/notifications/server/creation";

interface CreateMentorAssignmentInput {
  mentorId: string;
  studentId: string;
  enrollmentId?: string;
  isPrimary?: boolean;
  notes?: string;
  assignedById?: string;
}

/**
 * The one write path for a new Student<->Mentor relationship - both the
 * admin "assign a mentor" action and any future automatic assignment (e.g.
 * from enrollment creation) should call this rather than inserting
 * MentorAssignment directly, so the MENTOR_ASSIGNED notification always
 * fires alongside the row.
 */
export async function createMentorAssignment(input: CreateMentorAssignmentInput): Promise<MentorAssignment> {
  const assignment = await prisma.mentorAssignment.create({
    data: {
      mentorId: input.mentorId,
      studentId: input.studentId,
      enrollmentId: input.enrollmentId,
      isPrimary: input.isPrimary ?? true,
      notes: input.notes,
      assignedById: input.assignedById,
    },
    include: { mentor: { include: { user: true } } },
  });

  try {
    await createNotification({
      userId: input.studentId,
      type: "MENTOR_ASSIGNED",
      title: "You have a new mentor",
      body: assignment.mentor.user.name
        ? `${assignment.mentor.user.name} has been assigned as your mentor.`
        : "A mentor has been assigned to you.",
      link: `/student/mentors/${assignment.mentorId}`,
    });
  } catch (error) {
    console.error("createMentorAssignment: notification failed:", error);
  }

  return assignment;
}

/** Ends an assignment (temporary mentors, or reassignment) without deleting the historical row. */
export async function endMentorAssignment(assignmentId: string): Promise<MentorAssignment> {
  return prisma.mentorAssignment.update({
    where: { id: assignmentId },
    data: { status: "ENDED", endDate: new Date() },
  });
}
