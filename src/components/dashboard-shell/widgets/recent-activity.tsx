import Link from "next/link";

import { cn } from "@/lib/utils";
import { DashboardCard } from "@/components/dashboard-shell/widgets/dashboard-card";

export interface ActivityItem {
  title: string;
  description?: string;
  timeLabel: string;
  href?: string;
}

export interface RecentActivityProps {
  items: ActivityItem[];
  emptyLabel?: string;
  className?: string;
}

/**
 * A generic timestamped list - the same shape works for "Recent Blogs"
 * (Student), a future "Recent Activity" feed (any role), or anything else
 * that's fundamentally "a few recent things with a time label." Renders
 * nothing fancy when empty; pair with EmptyState
 * (src/components/sections/empty-state.tsx) instead when the empty case
 * needs its own call-to-action, as Saved Programs/Current Projects/
 * Invoices do.
 */
function RecentActivity({ items, emptyLabel = "Nothing here yet.", className }: RecentActivityProps) {
  if (items.length === 0) {
    return (
      <DashboardCard className={className}>
        <p className="text-muted-foreground py-6 text-center text-sm">{emptyLabel}</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard padding="compact" className={cn("divide-border gap-0 divide-y p-0", className)}>
      {items.map((item, index) => {
        const row = (
          <div className="flex flex-col gap-0.5 px-4 py-3">
            <p className="text-foreground text-sm font-medium">{item.title}</p>
            {item.description && (
              <p className="text-muted-foreground text-sm text-pretty">{item.description}</p>
            )}
            <p className="text-muted-foreground/70 text-xs">{item.timeLabel}</p>
          </div>
        );
        return item.href ? (
          <Link
            key={item.title + index}
            href={item.href}
            className="hover:bg-accent/50 block transition-colors duration-150 ease-out first:rounded-t-lg last:rounded-b-lg"
          >
            {row}
          </Link>
        ) : (
          <div key={item.title + index}>{row}</div>
        );
      })}
    </DashboardCard>
  );
}

export { RecentActivity };
