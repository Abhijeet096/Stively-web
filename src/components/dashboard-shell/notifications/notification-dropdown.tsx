"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/dashboard-shell/notifications/notification-bell";
import type { Notification } from "@/components/dashboard-shell/notifications/notification-data";
import {
  markNotificationRead,
  markAllNotificationsRead,
  getRecentNotifications,
} from "@/features/notifications/actions/notification-actions";
import { playNotificationSound } from "@/lib/notification-sound";

export interface NotificationDropdownProps {
  initialNotifications: Notification[];
}

// A lead filling out /start-project should be heard about quickly without
// standing up a websocket/SSE server on Vercel's serverless functions just
// for this - 15s polling is a deliberately simple, low-complexity choice
// (see ARCHITECTURE_DECISIONS.md AD-009) matched to "someone should notice
// within a few seconds," not sub-second delivery.
const POLL_INTERVAL_MS = 15000;

/**
 * Owns the notification list's read/unread state client-side, seeded from
 * a real server-fetched list (src/features/notifications/server/queries.ts,
 * read in the (portal)/(dashboard) layout and passed down through
 * DashboardShell/Topbar) and kept fresh afterward by polling
 * getRecentNotifications every POLL_INTERVAL_MS - the layout-level fetch
 * only ever runs once per navigation, so without this, a lead arriving
 * while someone's already sitting on the page would go unnoticed until a
 * manual refresh. A chime (src/lib/notification-sound.ts) plays only when a
 * poll turns up an id that wasn't in the previous poll - never on the
 * initial mount, and never twice for the same notification. Marking read
 * updates local state immediately (no flash of stale unread state) and
 * fires the real server action alongside it.
 */
function NotificationDropdown({ initialNotifications }: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const knownIdsRef = React.useRef(new Set(initialNotifications.map((n) => n.id)));
  const unreadCount = notifications.filter((n) => !n.read).length;

  React.useEffect(() => {
    let cancelled = false;

    async function poll() {
      let fresh: Notification[];
      try {
        fresh = await getRecentNotifications();
      } catch {
        return; // transient failure - next interval tries again
      }
      if (cancelled) return;

      const hasNewArrival = fresh.some((n) => !knownIdsRef.current.has(n.id));
      knownIdsRef.current = new Set(fresh.map((n) => n.id));
      setNotifications(fresh);
      if (hasNewArrival) playNotificationSound();
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void markNotificationRead(id);
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id);
    if (notification.href) router.push(notification.href);
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void markAllNotificationsRead();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <NotificationBell unreadCount={unreadCount} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3.5 py-3">
          <p className="text-foreground text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-primary text-xs font-medium hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto p-1.5">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">
              You&apos;re all caught up.
            </p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors duration-100",
                  "hover:bg-accent"
                )}
              >
                <Circle
                  className={cn(
                    "mt-1.5 size-2 shrink-0",
                    notification.read ? "text-transparent" : "fill-primary text-primary"
                  )}
                  aria-hidden="true"
                />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-foreground text-sm font-medium">{notification.title}</span>
                  <span className="text-muted-foreground text-xs text-pretty">
                    {notification.description}
                  </span>
                  <span className="text-muted-foreground/70 mt-0.5 text-xs">
                    {notification.timeLabel}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        {/* Future extension point: a dedicated notifications page (e.g.
            /student/notifications) once a real backend exists - kept as a
            quiet footer action rather than a dead link in the meantime. */}
        <div className="border-t px-3.5 py-2.5 text-center">
          <span className="text-muted-foreground text-xs font-medium">View all notifications</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { NotificationDropdown };
