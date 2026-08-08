import { prisma } from "@/lib/prisma";
import { isValidCronRequest } from "@/features/lead-intelligence/server/cron-auth";
import { notifyMeetingReminder } from "@/features/notifications/server/meeting-reminder";

const REMINDER_WINDOW_MS = 30 * 60 * 1000;

/**
 * Pinged externally every few minutes (Vercel's Hobby-tier cron can't run
 * more often than daily, so this isn't declared in vercel.json's own crons
 * array - a free external pinger like cron-job.org hits it instead, using
 * the same CRON_SECRET/Bearer scheme isValidCronRequest already checks for
 * Vercel-triggered crons). Finds every LeadMeeting/SalesLeadMeeting still
 * SCHEDULED, starting within the next 30 minutes, that hasn't been
 * reminded yet - fires one notification per meeting, then stamps
 * reminderSentAt so a meeting is never reminded twice even if this runs
 * every 5 minutes and a meeting sits in the window across several runs.
 */
export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

  const [dueLeadMeetings, dueSalesLeadMeetings] = await Promise.all([
    prisma.leadMeeting.findMany({
      where: { status: "SCHEDULED", reminderSentAt: null, scheduledAt: { gte: now, lte: windowEnd } },
      include: { lead: { select: { name: true } } },
    }),
    prisma.salesLeadMeeting.findMany({
      where: { status: "SCHEDULED", reminderSentAt: null, scheduledAt: { gte: now, lte: windowEnd } },
      include: { salesLead: { select: { businessName: true } } },
    }),
  ]);

  let remindedCount = 0;

  for (const meeting of dueLeadMeetings) {
    await notifyMeetingReminder({
      scheduledById: meeting.scheduledById,
      scheduledAt: meeting.scheduledAt,
      entityLabel: meeting.lead.name,
      link: `/admin/leads/${meeting.leadId}`,
    }).catch((error) => console.error("meeting-reminders: LeadMeeting notify failed:", meeting.id, error));
    await prisma.leadMeeting.update({ where: { id: meeting.id }, data: { reminderSentAt: now } });
    remindedCount++;
  }

  for (const meeting of dueSalesLeadMeetings) {
    await notifyMeetingReminder({
      scheduledById: meeting.scheduledById,
      scheduledAt: meeting.scheduledAt,
      entityLabel: meeting.salesLead.businessName,
      link: `/sales/leads/${meeting.salesLeadId}`,
    }).catch((error) => console.error("meeting-reminders: SalesLeadMeeting notify failed:", meeting.id, error));
    await prisma.salesLeadMeeting.update({ where: { id: meeting.id }, data: { reminderSentAt: now } });
    remindedCount++;
  }

  return Response.json({ ok: true, remindedCount });
}
