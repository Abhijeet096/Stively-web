import type { Meeting } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const STATUS_VARIANT: Record<Meeting["status"], NonNullable<BadgeProps["variant"]>> = {
  SCHEDULED: "default",
  COMPLETED: "success",
  CANCELLED: "outline",
  NO_SHOW: "destructive",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/**
 * Read-only mirror of the admin Operations panel's MeetingList - a
 * customer should see any meeting scheduled about their order without
 * needing to be told separately (see notifyMeetingScheduled, which fires
 * the dashboard notification + email this card complements). No status
 * controls here - only staff change a meeting's status.
 */
function OrderMeetings({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) return null;

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Meetings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="border-border flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground text-sm font-medium">{formatDateTime(meeting.scheduledAt)}</span>
              <Badge variant={STATUS_VARIANT[meeting.status]}>{meeting.status.replaceAll("_", " ")}</Badge>
            </div>
            {meeting.notes && <p className="text-muted-foreground text-sm">{meeting.notes}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { OrderMeetings };
