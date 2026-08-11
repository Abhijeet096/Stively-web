import "server-only";

import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/**
 * The one writer every feature calls to produce a notification - the real
 * implementation the "future notification delivery" stubs elsewhere in this
 * codebase (enrollments/lib/events.ts and its siblings in offering-requests/
 * orders) were anticipating but never had a backend to call. Callers wrap
 * this in try/catch at the call site (the established non-fatal
 * cross-feature integration discipline) so a notification failure never
 * blocks the primary action it's attached to.
 */
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });
}

/** Fan-out helper for events with more than one recipient (e.g. a mentor announcement to every assigned student). Each write is independent - one failure doesn't block the rest. */
export async function createNotifications(inputs: CreateNotificationInput[]) {
  const results = await Promise.allSettled(inputs.map((input) => createNotification(input)));
  return results;
}

/**
 * Every ADMIN/SUPER_ADMIN, plus an optional extra recipient (e.g. an
 * assigned salesperson), deduped so nobody gets the same event twice. The
 * standing pattern for "this must never go unnoticed" events in a
 * solo-founder-scale operation - see AD-014 (client messages) and AD-016
 * (lead qualification) for why assignment-only notification isn't enough
 * here: leads/threads sit unassigned far more often than not, so
 * "notify the assignee" alone can mean "notify nobody."
 */
export async function notifyAllAdmins(
  input: Omit<CreateNotificationInput, "userId">,
  extraUserId?: string | null
): Promise<void> {
  const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true } });
  const recipientIds = new Set(admins.map((a) => a.id));
  if (extraUserId) recipientIds.add(extraUserId);

  await createNotifications(Array.from(recipientIds).map((userId) => ({ ...input, userId })));
}
