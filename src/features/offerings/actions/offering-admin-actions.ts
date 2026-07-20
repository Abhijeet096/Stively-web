"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { offeringAdminSchema, type OfferingAdminInput } from "../validation/offering-admin";

/**
 * Admin CRUD for Offering - scaffolded per the brief's "Admin Preparation"
 * section ("create architecture that later allows Admin to create/edit/
 * publish/archive/feature/delete without changing code"). No CMS UI calls
 * these yet (that's explicitly out of scope this phase); they exist so a
 * future Admin CMS is a UI-only addition, not a backend one. Every action
 * re-validates via offeringAdminSchema and is gated by requireRole -
 * defense-in-depth even though nothing routes here today.
 */

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input";
}

export async function createOffering(input: OfferingAdminInput): Promise<ActionResult> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = offeringAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  try {
    await prisma.offering.create({ data: { ...parsed.data, createdById: admin.id } });
    revalidatePath("/offerings");
    return { success: true };
  } catch (error) {
    console.error("createOffering failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateOffering(id: string, input: OfferingAdminInput): Promise<ActionResult> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = offeringAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  try {
    await prisma.offering.update({ where: { id }, data: { ...parsed.data, updatedById: admin.id } });
    revalidatePath("/offerings");
    revalidatePath(`/offerings/${parsed.data.slug}`);
    return { success: true };
  } catch (error) {
    console.error("updateOffering failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

async function setStatus(
  id: string,
  status: "PUBLISHED" | "ARCHIVED" | "DRAFT" | "COMING_SOON"
): Promise<ActionResult> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    await prisma.offering.update({
      where: { id },
      data: {
        status,
        updatedById: admin.id,
        ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
      },
    });
    revalidatePath("/offerings");
    return { success: true };
  } catch (error) {
    console.error("setStatus failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function publishOffering(id: string): Promise<ActionResult> {
  return setStatus(id, "PUBLISHED");
}

export async function archiveOffering(id: string): Promise<ActionResult> {
  return setStatus(id, "ARCHIVED");
}

export async function featureOffering(id: string, featured: boolean): Promise<ActionResult> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    await prisma.offering.update({ where: { id }, data: { featured, updatedById: admin.id } });
    revalidatePath("/offerings");
    return { success: true };
  } catch (error) {
    console.error("featureOffering failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deleteOffering(id: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    await prisma.offering.delete({ where: { id } });
    revalidatePath("/offerings");
    return { success: true };
  } catch (error) {
    console.error("deleteOffering failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
