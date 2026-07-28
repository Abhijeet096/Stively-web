"use server";

import { revalidatePath } from "next/cache";

import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import {
  postProjectUpdateSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  deleteMilestoneSchema,
  updateProjectProgressSchema,
} from "../validation/project-schemas";
import { resolveSalesCrmViewer } from "../server/rbac";
import { logSalesLeadActivity } from "../server/creation";
import { createNotification } from "@/features/notifications/server/creation";

async function assertProjectAccess(salesProjectId: string, userId: string, role: Role) {
  const viewer = await resolveSalesCrmViewer(userId, role);
  const project = await prisma.salesProject.findUnique({ where: { id: salesProjectId }, include: { salesLead: true } });
  if (!project) return { ok: false as const, error: "Project not found." };
  if (!viewer.hasFullAccess && project.salesPersonId !== viewer.teamMemberId) {
    return { ok: false as const, error: "Project not found." };
  }
  return { ok: true as const, project };
}

function revalidateProject(salesProjectId: string, salesLeadId: string) {
  revalidatePath(`/admin/sales-crm/projects/${salesProjectId}`);
  revalidatePath(`/sales/projects/${salesProjectId}`);
  revalidatePath(`/client/projects/${salesLeadId}`);
  revalidatePath("/client/dashboard");
}

/** The "Today / Tomorrow" progress feed - post-only, newest first, same convention as SalesLeadNotesPanel. Notifies the linked client if there is one. */
export async function postProjectUpdate(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = postProjectUpdateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const access = await assertProjectAccess(data.salesProjectId, user.id, user.role);
    if (!access.ok) return { success: false, error: access.error };

    const teamMember = await prisma.teamMember.findUnique({ where: { userId: user.id }, select: { id: true } });

    await prisma.projectUpdate.create({
      data: {
        salesProjectId: data.salesProjectId,
        completedItems: data.completedItems,
        plannedNextItems: data.plannedNextItems,
        blockers: data.blockers,
        postedById: teamMember?.id,
      },
    });
    await logSalesLeadActivity({
      salesLeadId: access.project.salesLeadId,
      type: "PROJECT_UPDATE_POSTED",
      description: data.completedItems[0],
      performedById: teamMember?.id,
    });

    if (access.project.salesLead.clientUserId) {
      await createNotification({
        userId: access.project.salesLead.clientUserId,
        type: "PROJECT_UPDATE_POSTED",
        title: `New progress update: ${access.project.clientName}`,
        body: data.completedItems[0],
        link: `/client/projects/${access.project.salesLeadId}`,
      }).catch((error) => console.error("postProjectUpdate notification failed:", error));
    }

    revalidateProject(data.salesProjectId, access.project.salesLeadId);
    return { success: true };
  } catch (error) {
    console.error("postProjectUpdate failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Appends a new milestone to the end of the timeline - order is just the current count, no manual reordering in this pass. */
export async function createMilestone(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = createMilestoneSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const access = await assertProjectAccess(data.salesProjectId, user.id, user.role);
    if (!access.ok) return { success: false, error: access.error };

    const count = await prisma.projectMilestone.count({ where: { salesProjectId: data.salesProjectId } });
    await prisma.projectMilestone.create({
      data: { salesProjectId: data.salesProjectId, label: data.label, order: count },
    });

    revalidateProject(data.salesProjectId, access.project.salesLeadId);
    return { success: true };
  } catch (error) {
    console.error("createMilestone failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Updates a milestone's status/percent - the sole edit surface for the client-facing timeline. Notifies the linked client on status change. */
export async function updateMilestone(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = updateMilestoneSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const milestone = await prisma.projectMilestone.findUnique({ where: { id: data.milestoneId } });
    if (!milestone) return { success: false, error: "Milestone not found." };

    const access = await assertProjectAccess(milestone.salesProjectId, user.id, user.role);
    if (!access.ok) return { success: false, error: access.error };

    await prisma.projectMilestone.update({
      where: { id: data.milestoneId },
      data: {
        status: data.status,
        percentComplete: data.status === "IN_PROGRESS" ? data.percentComplete : null,
        completedAt: data.status === "DONE" ? new Date() : null,
      },
    });
    await logSalesLeadActivity({
      salesLeadId: access.project.salesLeadId,
      type: "MILESTONE_UPDATED",
      description: `${milestone.label}: ${data.status}`,
    });

    if (access.project.salesLead.clientUserId) {
      await createNotification({
        userId: access.project.salesLead.clientUserId,
        type: "MILESTONE_UPDATED",
        title: `Milestone updated: ${milestone.label}`,
        body: `${access.project.clientName} - now ${data.status.replace("_", " ").toLowerCase()}.`,
        link: `/client/projects/${access.project.salesLeadId}`,
      }).catch((error) => console.error("updateMilestone notification failed:", error));
    }

    revalidateProject(milestone.salesProjectId, access.project.salesLeadId);
    return { success: true };
  } catch (error) {
    console.error("updateMilestone failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deleteMilestone(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = deleteMilestoneSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const milestone = await prisma.projectMilestone.findUnique({ where: { id: parsed.data.milestoneId } });
    if (!milestone) return { success: false, error: "Milestone not found." };

    const access = await assertProjectAccess(milestone.salesProjectId, user.id, user.role);
    if (!access.ok) return { success: false, error: access.error };

    await prisma.projectMilestone.delete({ where: { id: parsed.data.milestoneId } });

    revalidateProject(milestone.salesProjectId, access.project.salesLeadId);
    return { success: true };
  } catch (error) {
    console.error("deleteMilestone failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Admin-set overall completion + warranty window - never derived, per SalesProject.progressPercent's own schema comment. Shown on the client's project card and dashboard. */
export async function updateProjectProgress(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = updateProjectProgressSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const access = await assertProjectAccess(data.salesProjectId, user.id, user.role);
    if (!access.ok) return { success: false, error: access.error };

    await prisma.salesProject.update({
      where: { id: data.salesProjectId },
      data: { progressPercent: data.progressPercent, warrantyExpiresAt: data.warrantyExpiresAt },
    });

    revalidateProject(data.salesProjectId, access.project.salesLeadId);
    return { success: true };
  } catch (error) {
    console.error("updateProjectProgress failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
