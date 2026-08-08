import "server-only";

import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { createNotification } from "./creation";

/**
 * Shared by the meeting-reminder cron (src/app/api/cron/meeting-reminders)
 * for both LeadMeeting and SalesLeadMeeting - same recipient shape either
 * way (the TeamMember who scheduled it), just a different link/label per
 * caller. Deliberately staff-facing only: the client-facing "it's
 * scheduled" notice already fires at creation time (notifySalesMeetingScheduled)
 * and isn't repeated here. Always emails the TeamMember's own address
 * (always present); the in-app notification only lands if that TeamMember
 * is linked to a real User account.
 */
export async function notifyMeetingReminder(params: {
  scheduledById: string | null;
  scheduledAt: Date;
  entityLabel: string;
  link: string;
}): Promise<void> {
  if (!params.scheduledById) return;

  const teamMember = await prisma.teamMember.findUnique({
    where: { id: params.scheduledById },
    select: { userId: true, email: true, name: true },
  });
  if (!teamMember) return;

  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(
    params.scheduledAt
  );
  const title = "Meeting in 30 minutes";
  const body = `Your meeting with ${params.entityLabel} is at ${when}.`;

  if (teamMember.userId) {
    try {
      await createNotification({
        userId: teamMember.userId,
        type: "MEETING_REMINDER",
        title,
        body,
        link: params.link,
      });
    } catch (error) {
      console.error("notifyMeetingReminder: in-app notification failed:", error);
    }
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: teamMember.email,
      subject: title,
      html: `<p>${teamMember.name ? `Hi ${teamMember.name},` : "Hi,"}</p><p>${body}</p><p><a href="${siteConfig.url}${params.link}">View details</a></p>`,
    });
  } catch (error) {
    console.error("notifyMeetingReminder: email failed:", error);
  }
}
