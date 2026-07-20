"use server";

import { revalidatePath } from "next/cache";
import type { AccessGrantReason } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { emitEnrollmentEvent } from "../lib/events";
import { completeEnrollment } from "../server/creation";

/**
 * Admin CRUD for OfferingEnrollment - scaffolded per the brief's "Admin
 * Preparation" section, the exact same pattern as every prior phase's
 * admin-actions module (offering-requests, orders, operations). No
 * dedicated enrollment-management UI exists yet beyond the Operations
 * detail-page integration (operation-detail-view.tsx); every action here
 * is real, Zod-adjacent-validated (enum params are narrow types already),
 * and gated by requireRole.
 */

async function resolveActorTeamMemberId(): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return undefined;
  const teamMember = await prisma.teamMember.findUnique({ where: { userId: session.user.id } });
  return teamMember?.id;
}

function revalidateEnrollment() {
  revalidatePath("/student/learning");
  revalidatePath("/admin/operations");
}

async function setAccessGranted(
  enrollmentId: string,
  granted: boolean,
  reason: AccessGrantReason,
  grantedById: string | undefined
) {
  const now = new Date();
  await prisma.$transaction([
    prisma.offeringEnrollment.update({
      where: { id: enrollmentId },
      data: granted
        ? { accessGranted: true, accessGrantedAt: now }
        : { accessGranted: false, accessRevokedAt: now },
    }),
    prisma.accessGrant.create({
      data: { enrollmentId, granted, reason, grantedById },
    }),
  ]);
}

export async function activateEnrollment(enrollmentId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.offeringEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!current) return { success: false, error: "Enrollment not found" };

    const actorId = await resolveActorTeamMemberId();
    const now = new Date();

    const updated = await prisma.offeringEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "ACTIVE",
        startDate: current.startDate ?? now,
        history: { create: { eventType: "ACTIVATED", fromStatus: current.status, toStatus: "ACTIVE" } },
      },
    });
    if (!current.accessGranted) {
      await setAccessGranted(enrollmentId, true, "ADMIN_APPROVED", actorId);
    }

    emitEnrollmentEvent("ENROLLMENT_ACTIVATED", updated);
    revalidateEnrollment();
    return { success: true };
  } catch (error) {
    console.error("activateEnrollment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function pauseEnrollment(enrollmentId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.offeringEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!current) return { success: false, error: "Enrollment not found" };

    await prisma.offeringEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "PAUSED",
        history: { create: { eventType: "PAUSED", fromStatus: current.status, toStatus: "PAUSED" } },
      },
    });
    revalidateEnrollment();
    return { success: true };
  } catch (error) {
    console.error("pauseEnrollment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function resumeEnrollment(enrollmentId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.offeringEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!current) return { success: false, error: "Enrollment not found" };

    await prisma.offeringEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "ACTIVE",
        history: { create: { eventType: "RESUMED", fromStatus: current.status, toStatus: "ACTIVE" } },
      },
    });
    revalidateEnrollment();
    return { success: true };
  } catch (error) {
    console.error("resumeEnrollment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function cancelEnrollment(enrollmentId: string, reason?: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.offeringEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!current) return { success: false, error: "Enrollment not found" };

    const actorId = await resolveActorTeamMemberId();

    await prisma.offeringEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "CANCELLED",
        history: {
          create: { eventType: "CANCELLED", fromStatus: current.status, toStatus: "CANCELLED", description: reason },
        },
      },
    });
    if (current.accessGranted) {
      await setAccessGranted(enrollmentId, false, "MANUAL_OVERRIDE", actorId);
    }
    revalidateEnrollment();
    return { success: true };
  } catch (error) {
    console.error("cancelEnrollment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function extendEnrollment(enrollmentId: string, newEndDate: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.offeringEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!current) return { success: false, error: "Enrollment not found" };

    const endDate = new Date(newEndDate);
    await prisma.offeringEnrollment.update({
      where: { id: enrollmentId },
      data: {
        endDate,
        history: { create: { eventType: "EXTENDED", description: endDate.toLocaleDateString("en-IN") } },
      },
    });
    revalidateEnrollment();
    return { success: true };
  } catch (error) {
    console.error("extendEnrollment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function expireEnrollment(enrollmentId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.offeringEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!current) return { success: false, error: "Enrollment not found" };

    const actorId = await resolveActorTeamMemberId();

    await prisma.offeringEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "EXPIRED",
        history: { create: { eventType: "EXPIRED", fromStatus: current.status, toStatus: "EXPIRED" } },
      },
    });
    if (current.accessGranted) {
      await setAccessGranted(enrollmentId, false, "EXPIRED", actorId);
    }
    revalidateEnrollment();
    return { success: true };
  } catch (error) {
    console.error("expireEnrollment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function markCompleted(enrollmentId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const updated = await completeEnrollment(enrollmentId);
    if (!updated) return { success: false, error: "Enrollment not found" };
    revalidateEnrollment();
    return { success: true };
  } catch (error) {
    console.error("markCompleted failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
