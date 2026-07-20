import type { ActivityLog, TeamMember } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ACTIVITY_LABEL, ACTIVITY_ICON } from "../lib/activity-labels";

type ActivityWithActor = ActivityLog & { performedBy: TeamMember | null };

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Generalizes src/components/dashboard/lead-timeline.tsx's exact card+list pattern over ActivityLog instead of LeadHistory - same "newest first" display convention. */
function ActivityTimeline({ activities }: { activities: ActivityWithActor[] }) {
  const newestFirst = [...activities].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {newestFirst.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {newestFirst.map((activity) => {
              const Icon = ACTIVITY_ICON[activity.type];
              return (
                <li key={activity.id} className="border-border flex gap-3 border-l-2 pl-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                      <Icon className="text-muted-foreground size-3.5" aria-hidden="true" />
                      {ACTIVITY_LABEL[activity.type]}
                    </span>
                    {activity.description && (
                      <span className="text-muted-foreground text-sm">{activity.description}</span>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(activity.createdAt)}
                      {activity.performedBy && ` · ${activity.performedBy.name}`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export { ActivityTimeline };
