"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { scheduleSalesLeadMeetingSchema, updateSalesLeadMeetingStatusSchema } from "../validation/meeting-schemas";
import { resolveSalesCrmViewer } from "../server/rbac";
import { notifySalesMeetingScheduled } from "../server/notify";

async function actorTeamMemberId(userId: string): Promise<string | undefined> {
  const member = await prisma.teamMember.findUnique({ where: { userId } });
  return member?.id;
}

/** Admin-initiated only, per the plan - the client sees/receives, doesn't propose times themselves. Pre-sale, so this lives on SalesLead directly, not SalesProject (matches ClientDocument's own precedent of being deliverable before a project exists). */
export async function scheduleSalesLeadMeeting(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = scheduleSalesLeadMeetingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: data.salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    const scheduledById = await actorTeamMemberId(user.id);
    const scheduledAt = new Date(data.scheduledAt);

    const [meeting] = await prisma.$transaction([
      prisma.salesLeadMeeting.create({
        data: {
          salesLeadId: data.salesLeadId,
          scheduledAt,
          method: data.method,
          meetingLink: data.meetingLink,
          notes: data.notes,
          scheduledById,
        },
      }),
      prisma.salesLeadActivity.create({
        data: {
          salesLeadId: data.salesLeadId,
          type: "MEETING_SCHEDULED",
          description: scheduledAt.toLocaleString("en-IN"),
          performedById: scheduledById ?? null,
        },
      }),
    ]);

    await notifySalesMeetingScheduled(data.salesLeadId, meeting).catch((error) =>
      console.error("notifySalesMeetingScheduled failed:", error)
    );

    revalidatePath(`/admin/sales-crm/leads/${data.salesLeadId}`);
    revalidatePath(`/sales/leads/${data.salesLeadId}`);
    revalidatePath(`/client/projects/${data.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("scheduleSalesLeadMeeting failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Lets admin mark a scheduled meeting done/cancelled/no-show after the fact - a light status update, not a reschedule flow. */
export async function updateSalesLeadMeetingStatus(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = updateSalesLeadMeetingStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const meeting = await prisma.salesLeadMeeting.findUnique({ where: { id: data.meetingId } });
    if (!meeting) return { success: false, error: "Meeting not found." };

    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: meeting.salesLeadId } });
    if (!lead) return { success: false, error: "Meeting not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Meeting not found." };
    }

    await prisma.salesLeadMeeting.update({ where: { id: data.meetingId }, data: { status: data.status } });

    revalidatePath(`/admin/sales-crm/leads/${meeting.salesLeadId}`);
    revalidatePath(`/sales/leads/${meeting.salesLeadId}`);
    revalidatePath(`/client/projects/${meeting.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("updateSalesLeadMeetingStatus failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
