import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NotificationBellProps {
  unreadCount: number;
  className?: string;
}

/**
 * Purely presentational - the icon + unread dot/count. Kept separate from
 * NotificationDropdown (which owns the actual notification state and the
 * dropdown panel) so the bell glyph itself is reusable anywhere a compact
 * unread indicator is useful, independent of the dropdown behavior.
 */
function NotificationBell({ unreadCount, className }: NotificationBellProps) {
  return (
    <span className={cn("relative flex items-center justify-center", className)}>
      <Bell className="size-[18px]" aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          className="border-background bg-destructive absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 text-[9px] font-semibold text-white tabular-nums"
          aria-hidden="true"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </span>
  );
}

export { NotificationBell };
