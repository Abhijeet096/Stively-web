import Link from "next/link";

import type { FollowUpBuckets } from "@/lib/queries/leads";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const BUCKET_CONFIG = [
  { key: "overdue", label: "Overdue", dotClassName: "bg-destructive" },
  { key: "today", label: "Today", dotClassName: "bg-warning" },
  { key: "upcoming", label: "Upcoming (7 days)", dotClassName: "bg-success" },
] as const;

/**
 * Green/orange/red per this task's explicit instruction - implemented as
 * a small colored dot next to each lead rather than coloring the whole
 * row, so it reads as a status indicator (matching how LeadStatusBadge
 * already uses color) rather than a jarring background wash.
 */
function FollowUpList({ followUps }: { followUps: FollowUpBuckets }) {
  const hasAny = followUps.overdue.length + followUps.today.length + followUps.upcoming.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-ups</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!hasAny && <p className="text-muted-foreground text-sm">No follow-ups scheduled.</p>}
        {BUCKET_CONFIG.map((bucket) => {
          const leads = followUps[bucket.key];
          if (leads.length === 0) return null;
          return (
            <div key={bucket.key} className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {bucket.label} ({leads.length})
              </span>
              <ul className="flex flex-col gap-1.5">
                {leads.slice(0, 5).map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="hover:text-primary flex items-center gap-2 text-sm"
                    >
                      <span
                        className={`size-2 shrink-0 rounded-full ${bucket.dotClassName}`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{lead.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { FollowUpList };
