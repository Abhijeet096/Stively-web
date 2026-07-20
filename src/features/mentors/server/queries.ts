import "server-only";

import { prisma } from "@/lib/prisma";
import type { Mentor, MentorAssignment } from "@prisma/client";

/** Resolves the signed-in MENTOR-role user's own profile - every mentor-portal page/action starts here. */
export async function getMentorByUserId(userId: string): Promise<Mentor | null> {
  return prisma.mentor.findUnique({ where: { userId } });
}

export async function getMentorById(mentorId: string): Promise<Mentor | null> {
  return prisma.mentor.findUnique({ where: { id: mentorId } });
}

/** Every student currently assigned to this mentor - ownership-scoped by the caller resolving mentorId from their own session first. */
export async function getMyAssignedStudents(mentorId: string) {
  return prisma.mentorAssignment.findMany({
    where: { mentorId, status: "ACTIVE" },
    include: { student: true, enrollment: { include: { offering: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Every mentor currently assigned to this student. */
export async function getStudentMentors(studentId: string) {
  return prisma.mentorAssignment.findMany({
    where: { studentId, status: "ACTIVE" },
    include: { mentor: { include: { user: true } }, enrollment: { include: { offering: true } } },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
}

/** A single assignment, ownership-checked by mentorId+studentId together - returns null for both "not found" and "not this mentor's student" alike. */
export async function getAssignmentForMentorAndStudent(
  mentorId: string,
  studentId: string
): Promise<MentorAssignment | null> {
  return prisma.mentorAssignment.findFirst({ where: { mentorId, studentId, status: "ACTIVE" } });
}

/** Sessions this mentor is running - both curriculum-independent (1:1, office hours, group) and any legacy-hosted ones. */
export async function getMentorSessions(mentorId: string) {
  return prisma.liveSession.findMany({
    where: { mentorId },
    include: { attendees: { include: { student: true } } },
    orderBy: { scheduledAt: "desc" },
  });
}

/** Sessions a student has been invited to, across every mentor. */
export async function getStudentSessions(studentId: string) {
  return prisma.liveSession.findMany({
    where: { attendees: { some: { studentId } } },
    include: { mentor: { include: { user: true } }, attendees: { where: { studentId } } },
    orderBy: { scheduledAt: "desc" },
  });
}

/** The one running (mentor, student) thread - created on first message if it doesn't exist yet (idempotent, since @@unique([mentorId, studentId]) makes a second create race-safe to retry). */
export async function getOrCreateConversation(mentorId: string, studentId: string) {
  const existing = await prisma.mentorConversation.findUnique({
    where: { mentorId_studentId: { mentorId, studentId } },
  });
  if (existing) return existing;

  return prisma.mentorConversation.create({ data: { mentorId, studentId } });
}

/** Every conversation for a mentor, newest activity first - the mentor's message inbox. */
export async function getConversationsForMentor(mentorId: string) {
  return prisma.mentorConversation.findMany({
    where: { mentorId },
    include: { student: true },
    orderBy: { lastMessageAt: "desc" },
  });
}

/** Every conversation for a student, one per mentor. */
export async function getConversationsForStudent(studentId: string) {
  return prisma.mentorConversation.findMany({
    where: { studentId },
    include: { mentor: { include: { user: true } } },
    orderBy: { lastMessageAt: "desc" },
  });
}

/** A conversation by id, ownership-checked by whichever side (mentor or student) is asking. */
export async function getConversationForParticipant(conversationId: string, userId: string) {
  return prisma.mentorConversation.findFirst({
    where: { id: conversationId, OR: [{ mentor: { userId } }, { studentId: userId }] },
    include: { mentor: { include: { user: true } }, student: true },
  });
}

export async function getMessages(conversationId: string) {
  return prisma.mentorMessage.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });
}

/**
 * Submissions awaiting this mentor's review - every SUBMITTED/UNDER_REVIEW
 * AssessmentSubmission belonging to one of this mentor's assigned students'
 * enrollments. Queries AssessmentSubmission (Learning's own model)
 * directly rather than adding a mentor-scoped query to the learning
 * feature - "what should this mentor see" is a mentor-domain question even
 * though it reads Learning's data, the same cross-feature read pattern
 * Operations already uses against Order/OfferingRequest.
 */
export async function getSubmissionsForMentorReview(mentorId: string) {
  const assignments = await prisma.mentorAssignment.findMany({
    where: { mentorId, status: "ACTIVE" },
    select: { studentId: true },
  });
  const studentIds = assignments.map((a) => a.studentId);
  if (studentIds.length === 0) return [];

  return prisma.assessmentSubmission.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      enrollment: { studentId: { in: studentIds } },
    },
    include: {
      assessment: true,
      enrollment: { include: { student: true, offering: true } },
    },
    orderBy: { submittedAt: "asc" },
  });
}

/**
 * Read-only feed for the Operations detail page's MentorOpsCard - active
 * assignments for this student, optionally narrowed to one enrollment.
 * Mirrors EnrollmentOpsCard's own "just read, no workflow logic" scope.
 */
export async function getMentorForOperationsCard(studentId: string, enrollmentId?: string) {
  return prisma.mentorAssignment.findMany({
    where: {
      studentId,
      status: "ACTIVE",
      ...(enrollmentId ? { OR: [{ enrollmentId }, { enrollmentId: null }] } : {}),
    },
    include: { mentor: { include: { user: true } } },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
}
