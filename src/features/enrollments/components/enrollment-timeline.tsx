import type { EnrollmentHistory } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const EVENT_LABEL: Record<string, string> = {
  CREATED: "Enrollment created",
  ACTIVATED: "Activated",
  PAUSED: "Paused",
  RESUMED: "Resumed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  EXTENDED: "Extended",
  ACCESS_GRANTED: "Access granted",
  ACCESS_REVOKED: "Access revoked",
  PROGRESS_UPDATED: "Progress updated",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Generalizes lead-timeline.tsx/activity-timeline.tsx's exact card+list pattern over EnrollmentHistory - the "Enrollment Timeline" (Created/Activated/Paused/Resumed/Completed/Cancelled). */
function EnrollmentTimeline({ history }: { history: EnrollmentHistory[] }) {
  const newestFirst = [...history].reverse();

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
            {newestFirst.map((event) => (
              <li key={event.id} className="border-border flex gap-3 border-l-2 pl-4">
                <div className="flex flex-col">
                  <span className="text-foreground text-sm font-medium">
                    {EVENT_LABEL[event.eventType] ?? event.eventType}
                  </span>
                  {event.description && <span className="text-muted-foreground text-sm">{event.description}</span>}
                  <span className="text-muted-foreground text-xs">{formatDateTime(event.createdAt)}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export { EnrollmentTimeline };
