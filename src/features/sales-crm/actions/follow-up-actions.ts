"use server";

import { revalidatePath } from "next/cache";
import type { SalesLeadActivityType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { createFollowUpSchema, rescheduleFollowUpSchema } from "../validation/follow-up-task-schemas";
import { resolveSalesCrmViewer } from "../server/rbac";
import { logSalesLeadActivity } from "../server/creation";
import { createNotification } from "@/features/notifications/server/creation";

async function actorTeamMemberId(userId: string): Promise<string | undefined> {
  const teamMember = await prisma.teamMember.findUnique({ where: { userId } });
  return teamMember?.id;
}

export async function createFollowUp(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = createFollowUpSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: data.salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    const actorId = await actorTeamMemberId(user.id);
    await prisma.salesFollowUp.create({
      data: {
        salesLeadId: data.salesLeadId,
        assignedToId: data.assignedToId,
        type: data.type,
        dueAt: data.dueAt,
        notes: data.notes,
        createdById: actorId,
      },
    });
    await logSalesLeadActivity({
      salesLeadId: data.salesLeadId,
      type: "FOLLOW_UP_SCHEDULED",
      description: `Follow-up scheduled for ${data.dueAt.toLocaleDateString()}`,
      performedById: actorId,
    });

    // No scheduled/cron reminder job exists in this codebase - the
    // notification fires now, at creation time, rather than closer to the
    // due date (see NotificationType.FOLLOW_UP_REMINDER's schema comment).
    const assignee = await prisma.teamMember.findUnique({ where: { id: data.assignedToId }, select: { userId: true } });
    if (assignee?.userId) {
      try {
        await createNotification({
          userId: assignee.userId,
          type: "FOLLOW_UP_REMINDER",
          title: "Follow-up scheduled",
          body: `Follow up with ${lead.businessName} by ${data.dueAt.toLocaleString()}.`,
          link: `/admin/sales-crm/leads/${data.salesLeadId}`,
        });
      } catch (error) {
        console.error("createFollowUp notification failed:", error);
      }
    }

    revalidatePath(`/admin/sales-crm/leads/${data.salesLeadId}`);
    revalidatePath("/admin/sales-crm/follow-ups");
    return { success: true };
  } catch (error) {
    console.error("createFollowUp failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const COMPLETION_ACTIVITY_TYPE: Record<string, SalesLeadActivityType> = {
  CALL: "CALL_LOGGED",
  WHATSAPP: "WHATSAPP_LOGGED",
  EMAIL: "EMAIL_LOGGED",
  MEETING: "MEETING_SCHEDULED",
  OTHER: "STATUS_CHANGED",
};

export async function completeFollowUp(followUpId: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const followUp = await prisma.salesFollowUp.findUnique({ where: { id: followUpId } });
    if (!followUp) return { success: false, error: "Follow-up not found." };
    if (!viewer.hasFullAccess && followUp.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Follow-up not found." };
    }

    await prisma.salesFollowUp.update({
      where: { id: followUpId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await logSalesLeadActivity({
      salesLeadId: followUp.salesLeadId,
      type: COMPLETION_ACTIVITY_TYPE[followUp.type] ?? "STATUS_CHANGED",
      description: followUp.notes ?? `${followUp.type} follow-up completed`,
      performedById: await actorTeamMemberId(user.id),
    });

    revalidatePath(`/admin/sales-crm/leads/${followUp.salesLeadId}`);
    revalidatePath("/admin/sales-crm/follow-ups");
    return { success: true };
  } catch (error) {
    console.error("completeFollowUp failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Marks the current follow-up RESCHEDULED and creates a fresh PENDING one for the new date - keeps the original due date on record rather than overwriting it. */
export async function rescheduleFollowUp(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = rescheduleFollowUpSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const followUp = await prisma.salesFollowUp.findUnique({ where: { id: data.followUpId } });
    if (!followUp) return { success: false, error: "Follow-up not found." };
    if (!viewer.hasFullAccess && followUp.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Follow-up not found." };
    }

    await prisma.$transaction([
      prisma.salesFollowUp.update({ where: { id: data.followUpId }, data: { status: "RESCHEDULED" } }),
      prisma.salesFollowUp.create({
        data: {
          salesLeadId: followUp.salesLeadId,
          assignedToId: followUp.assignedToId,
          type: followUp.type,
          dueAt: data.dueAt,
          notes: followUp.notes,
          rescheduledFrom: followUp.dueAt,
          createdById: followUp.createdById,
        },
      }),
    ]);

    revalidatePath(`/admin/sales-crm/leads/${followUp.salesLeadId}`);
    revalidatePath("/admin/sales-crm/follow-ups");
    return { success: true };
  } catch (error) {
    console.error("rescheduleFollowUp failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
