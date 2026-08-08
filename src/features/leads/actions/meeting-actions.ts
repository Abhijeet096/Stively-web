"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/actions/leads";
import { resolveActorId } from "@/actions/crm";
import { scheduleLeadMeetingSchema, updateLeadMeetingStatusSchema } from "../validation/meeting-schemas";

/**
 * Pre-conversion meeting scheduling, for the first-touch call before any
 * SalesLead/client account exists - mirrors sales-crm/actions/meeting-actions.ts's
 * scheduleSalesLeadMeeting almost exactly, just against a raw Lead instead
 * of a SalesLead, and no client-facing notification (there's no client
 * account yet to notify - see LeadMeeting's own schema comment).
 */
export async function scheduleLeadMeeting(input: unknown): Promise<ActionResult> {
  const parsed = scheduleLeadMeetingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) return { success: false, error: "Lead not found." };

    const scheduledById = await resolveActorId();
    const scheduledAt = new Date(data.scheduledAt);

    await prisma.$transaction([
      prisma.leadMeeting.create({
        data: {
          leadId: data.leadId,
          scheduledAt,
          method: data.method,
          meetingLink: data.meetingLink,
          notes: data.notes,
          scheduledById,
        },
      }),
      prisma.leadHistory.create({
        data: {
          leadId: data.leadId,
          eventType: "MEETING_SCHEDULED",
          description: scheduledAt.toLocaleString("en-IN"),
          performedBy: scheduledById ?? null,
        },
      }),
    ]);

    revalidatePath(`/admin/leads/${data.leadId}`);
    return { success: true };
  } catch (error) {
    console.error("scheduleLeadMeeting failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Lets admin mark a scheduled meeting done/cancelled/no-show after the fact - same light status-only update as updateSalesLeadMeetingStatus, no reschedule flow. */
export async function updateLeadMeetingStatus(input: unknown): Promise<ActionResult> {
  const parsed = updateLeadMeetingStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const meeting = await prisma.leadMeeting.findUnique({ where: { id: data.meetingId } });
    if (!meeting) return { success: false, error: "Meeting not found." };

    await prisma.leadMeeting.update({ where: { id: data.meetingId }, data: { status: data.status } });

    revalidatePath(`/admin/leads/${meeting.leadId}`);
    return { success: true };
  } catch (error) {
    console.error("updateLeadMeetingStatus failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
