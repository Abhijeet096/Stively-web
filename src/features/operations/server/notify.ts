import "server-only";

import type { Meeting } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { createNotification } from "@/features/notifications/server/creation";

/**
 * Fires when staff schedule a Meeting against an OperationItem - the
 * customer previously had no way to find out short of staff telling them
 * separately. Resolves the target customer through whichever of
 * order/request the item wraps (exactly one is ever set - see
 * OperationItem's own schema comment), so this one function covers both
 * the ORDER and REQUEST flows rather than needing a copy per type. Called
 * non-fatally from scheduleMeeting (operation-actions.ts) - a failed
 * notification should never undo an already-created Meeting.
 */
export async function notifyMeetingScheduled(
  operationItemId: string,
  meeting: Meeting,
  /** Set when the underlying request has already been promoted into the Sales CRM (see scheduleMeeting) - the client's real project workspace, not the now-stale request page, is what should get linked. */
  promotedSalesLeadId?: string
): Promise<void> {
  const item = await prisma.operationItem.findUnique({
    where: { id: operationItemId },
    include: {
      order: { include: { offering: { select: { title: true } }, user: true } },
      request: { include: { offering: { select: { title: true } }, user: true } },
    },
  });
  if (!item) return;

  const source = item.order ?? item.request;
  if (!source) return;

  const { user, offering } = source;
  // A guest-checkout Order's user gets backfilled the moment payment is
  // confirmed (see guest-fulfillment.ts) - an OperationItem only ever
  // exists for an already-fulfilled order, so this should never actually
  // be null in practice. Guarding anyway since Order.userId is nullable at
  // the type level now.
  if (!user) return;
  const isOrder = item.type === "ORDER";
  const link = promotedSalesLeadId
    ? `/client/projects/${promotedSalesLeadId}`
    : `${user.role === "CLIENT" ? "/client" : "/student"}/${isOrder ? "orders" : "requests"}/${source.id}`;

  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(
    meeting.scheduledAt
  );

  await createNotification({
    userId: user.id,
    type: "MEETING_SCHEDULED",
    title: "Meeting scheduled",
    body: `A meeting about ${offering.title} is scheduled for ${when}.`,
    link,
  });

  if (!user.email) return;

  const greeting = user.name ? `Hi ${user.name},` : "Hi there,";
  await resend.emails.send({
    from: EMAIL_FROM,
    to: user.email,
    subject: `Meeting scheduled - ${offering.title}`,
    html: `<p>${greeting}</p><p>We've scheduled a meeting with you about <strong>${offering.title}</strong> for <strong>${when}</strong>.${
      meeting.notes ? `</p><p>${meeting.notes}` : ""
    }</p><p><a href="${siteConfig.url}${link}">View details</a></p>`,
  });
}
