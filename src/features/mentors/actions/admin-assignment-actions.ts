"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { assignMentorFormSchema } from "../validation/assignment-schemas";
import { createMentorAssignment, endMentorAssignment } from "../server/creation";

export async function assignMentorToStudent(mentorId: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = assignMentorFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const teamMember = await prisma.teamMember.findUnique({ where: { userId: user.id } });

    await createMentorAssignment({
      mentorId,
      studentId: data.studentId,
      enrollmentId: data.enrollmentId || undefined,
      isPrimary: data.isPrimary,
      notes: data.notes,
      assignedById: teamMember?.id,
    });

    revalidatePath(`/admin/mentors/${mentorId}`);
    return { success: true };
  } catch (error) {
    console.error("assignMentorToStudent failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function endAssignment(assignmentId: string, mentorId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  try {
    await endMentorAssignment(assignmentId);
    revalidatePath(`/admin/mentors/${mentorId}`);
    return { success: true };
  } catch (error) {
    console.error("endAssignment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
