"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { mentorProfileFormSchema, socialLinksSchema, availabilitySchema } from "../validation/mentor-schemas";
import { getMentorByUserId } from "../server/queries";

/** A mentor editing their own profile - never trusts a client-supplied mentorId, always resolves it from the signed-in user. */
export async function updateOwnProfile(input: unknown): Promise<ActionResult> {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  if (!mentor) return { success: false, error: "Mentor profile not found." };

  const parsed = mentorProfileFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    await prisma.mentor.update({
      where: { id: mentor.id },
      data: {
        headline: data.headline,
        bio: data.bio,
        expertiseAreas: data.expertiseAreas,
        languages: data.languages,
        experienceYears: data.experienceYears,
        profilePhotoUrl: data.profilePhotoUrl || null,
      },
    });
    revalidatePath("/mentor/profile");
    return { success: true };
  } catch (error) {
    console.error("updateOwnProfile failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateOwnSocialLinks(input: unknown): Promise<ActionResult> {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  if (!mentor) return { success: false, error: "Mentor profile not found." };

  const parsed = socialLinksSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid link." };

  try {
    await prisma.mentor.update({ where: { id: mentor.id }, data: { socialLinks: parsed.data } });
    revalidatePath("/mentor/profile");
    return { success: true };
  } catch (error) {
    console.error("updateOwnSocialLinks failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateOwnAvailability(input: unknown): Promise<ActionResult> {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  if (!mentor) return { success: false, error: "Mentor profile not found." };

  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await prisma.mentor.update({ where: { id: mentor.id }, data: { availability: parsed.data } });
    revalidatePath("/mentor/profile");
    return { success: true };
  } catch (error) {
    console.error("updateOwnAvailability failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
