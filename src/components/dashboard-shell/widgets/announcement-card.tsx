import { Megaphone } from "lucide-react";

import { DashboardCard } from "@/components/dashboard-shell/widgets/dashboard-card";

export interface Announcement {
  title: string;
  description: string;
  timeLabel: string;
}

/**
 * A single announcement row. Deliberately plain-text, no unread dot or
 * badge system of its own - announcements are broadcast, not personal
 * notifications (see notifications/ for that separate, per-user-state
 * system), so there's nothing here to "mark as read."
 */
function AnnouncementCard({ title, description, timeLabel }: Announcement) {
  return (
    <DashboardCard padding="compact" className="flex-row items-start gap-3">
      <span className="bg-warning/10 text-warning mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Megaphone className="size-4" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-foreground text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-sm text-pretty">{description}</p>
        <p className="text-muted-foreground/70 mt-1 text-xs">{timeLabel}</p>
      </div>
    </DashboardCard>
  );
}

export { AnnouncementCard };
