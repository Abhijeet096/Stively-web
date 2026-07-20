import type { Notification as NotificationRow } from "@prisma/client";
import type { Notification as NotificationUIItem } from "@/components/dashboard-shell/notifications/notification-data";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** DB row -> the notification bell's existing UI shape (notification-data.ts's `Notification` interface) - the swap its own comment anticipated. */
export function toNotificationUIItem(row: NotificationRow): NotificationUIItem {
  return {
    id: row.id,
    title: row.title,
    description: row.body ?? "",
    timeLabel: timeAgo(row.createdAt),
    read: row.read,
    href: row.link ?? undefined,
  };
}
