import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** For /admin/mentors' list - every Mentor with their User identity plus a cheap active-assignment count. */
export async function getAllMentors() {
  const mentors = await prisma.mentor.findMany({
    include: {
      user: true,
      assignments: { where: { status: "ACTIVE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return mentors.map((mentor) => ({ ...mentor, activeStudentCount: mentor.assignments.length }));
}

const adminMentorInclude = {
  user: true,
  affiliatedTeamMember: true,
  assignments: {
    where: { status: "ACTIVE" },
    include: { student: true, enrollment: { include: { offering: true } } },
    orderBy: { createdAt: "desc" as const },
  },
  sessions: { orderBy: { scheduledAt: "desc" as const } },
} satisfies Prisma.MentorInclude;

export type MentorForAdmin = Prisma.MentorGetPayload<{ include: typeof adminMentorInclude }>;

export async function getMentorForAdmin(id: string): Promise<MentorForAdmin | null> {
  return prisma.mentor.findUnique({ where: { id }, include: adminMentorInclude });
}

/** Students not already actively assigned to this mentor - the "assign a student" picker's candidate list. */
export async function getAssignableStudents(mentorId: string) {
  const activeStudentIds = (
    await prisma.mentorAssignment.findMany({
      where: { mentorId, status: "ACTIVE" },
      select: { studentId: true },
    })
  ).map((a) => a.studentId);

  return prisma.user.findMany({
    where: { role: "STUDENT", id: { notIn: activeStudentIds } },
    orderBy: { name: "asc" },
  });
}

/** A given student's own active enrollments - narrows the "program-specific or platform-wide" choice on the assignment form. */
export async function getStudentEnrollmentsForAssignment(studentId: string) {
  return prisma.offeringEnrollment.findMany({
    where: { studentId },
    include: { offering: true },
    orderBy: { createdAt: "desc" },
  });
}

/** MENTOR-role users without a Mentor profile yet - the "create mentor" form's user picker, plus a from-scratch (new user) path handled separately in the action. */
export async function getUsersWithoutMentorProfile() {
  return prisma.user.findMany({
    where: { role: "MENTOR", mentor: null },
    orderBy: { name: "asc" },
  });
}

export async function getAllTeamMembersForMentorAffiliation() {
  return prisma.teamMember.findMany({ orderBy: { name: "asc" } });
}
