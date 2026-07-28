import "server-only";

import type { SalesLeadMeeting } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { createNotification } from "@/features/notifications/server/creation";

/** Mirrors operations/server/notify.ts's notifyMeetingScheduled, targeting a SalesLead's linked client account instead of an OperationItem's order/request owner. No-ops (silently) if the lead has no portal account yet - the meeting still exists, it just can't notify anyone in-app. */
export async function notifySalesMeetingScheduled(salesLeadId: string, meeting: SalesLeadMeeting): Promise<void> {
  const lead = await prisma.salesLead.findUnique({
    where: { id: salesLeadId },
    include: { clientUser: true },
  });
  if (!lead?.clientUser) return;

  const link = `/client/projects/${salesLeadId}`;
  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(meeting.scheduledAt);

  await createNotification({
    userId: lead.clientUser.id,
    type: "SALES_MEETING_SCHEDULED",
    title: "Meeting scheduled",
    body: `A meeting for ${lead.businessName} is scheduled for ${when}.`,
    link,
  });

  if (!lead.clientUser.email) return;

  const greeting = lead.clientUser.name ? `Hi ${lead.clientUser.name},` : "Hi there,";
  await resend.emails.send({
    from: EMAIL_FROM,
    to: lead.clientUser.email,
    subject: `Meeting scheduled - ${lead.businessName}`,
    html: `<p>${greeting}</p><p>We've scheduled a meeting with you for <strong>${when}</strong>.${
      meeting.notes ? `</p><p>${meeting.notes}` : ""
    }</p><p><a href="${siteConfig.url}${link}">View details</a></p>`,
  });
}
