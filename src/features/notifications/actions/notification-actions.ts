"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { getNotificationsForUser } from "@/features/notifications/server/queries";
import { toNotificationUIItem } from "@/features/notifications/lib/format";
import type { Notification as NotificationUIItem } from "@/components/dashboard-shell/notifications/notification-data";

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const user = await requireUser();

  try {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.id },
    });
    if (!notification) return { success: false, error: "Not found" };

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("markNotificationRead failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await requireUser();

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true, readAt: new Date() },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("markAllNotificationsRead failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}

/**
 * Polled client-side by NotificationDropdown (see that component) to catch
 * new notifications without a full page reload/revalidate - the layout-level
 * fetch in (dashboard)/(portal) layout.tsx only ever runs once per
 * navigation, which is why a lead arriving while someone's already sitting
 * on /admin/leads previously required a manual refresh to see. Same
 * requireUser + userId-scoped query every other action here uses; returns
 * the already-read (Prisma), not just unread, list so the dropdown can fully
 * replace its state each poll rather than merging two partial lists.
 */
export async function getRecentNotifications(): Promise<NotificationUIItem[]> {
  const user = await requireUser();
  const rows = await getNotificationsForUser(user.id);
  return rows.map(toNotificationUIItem);
}
