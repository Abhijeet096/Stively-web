"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import type { ActionResult } from "@/actions/leads";
import { createMentorFormSchema, mentorProfileFormSchema } from "../validation/mentor-schemas";

/**
 * Admin-provisioned Mentor account + profile creation - see
 * createMentorFormSchema's comment for why this sets a password directly
 * rather than sending an invite email.
 */
export async function createMentor(input: unknown): Promise<ActionResult & { id?: string }> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = createMentorFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: "A user with this email already exists." };

    const passwordHash = await hashPassword(data.password);

    const mentor = await prisma.mentor.create({
      data: {
        type: data.type,
        headline: data.headline,
        bio: data.bio,
        expertiseAreas: data.expertiseAreas,
        languages: data.languages,
        experienceYears: data.experienceYears,
        profilePhotoUrl: data.profilePhotoUrl || undefined,
        affiliatedTeamMember: data.affiliatedTeamMemberId
          ? { connect: { id: data.affiliatedTeamMemberId } }
          : undefined,
        user: {
          create: {
            name: data.name,
            email: data.email,
            password: passwordHash,
            role: "MENTOR",
          },
        },
      },
    });

    revalidatePath("/admin/mentors");
    return { success: true, id: mentor.id };
  } catch (error) {
    console.error("createMentor failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateMentorProfile(mentorId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = mentorProfileFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    await prisma.mentor.update({
      where: { id: mentorId },
      data: {
        type: data.type,
        headline: data.headline,
        bio: data.bio,
        expertiseAreas: data.expertiseAreas,
        languages: data.languages,
        experienceYears: data.experienceYears,
        profilePhotoUrl: data.profilePhotoUrl || null,
        affiliatedTeamMemberId: data.affiliatedTeamMemberId || null,
      },
    });
    revalidatePath(`/admin/mentors/${mentorId}`);
    return { success: true };
  } catch (error) {
    console.error("updateMentorProfile failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function setMentorActive(mentorId: string, isActive: boolean): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  try {
    await prisma.mentor.update({ where: { id: mentorId }, data: { isActive } });
    revalidatePath(`/admin/mentors/${mentorId}`);
    revalidatePath("/admin/mentors");
    return { success: true };
  } catch (error) {
    console.error("setMentorActive failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
