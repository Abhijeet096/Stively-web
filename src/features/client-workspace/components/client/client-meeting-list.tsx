import { CalendarClock } from "lucide-react";
import type { SalesLeadMeeting } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";

const METHOD_LABEL: Record<NonNullable<SalesLeadMeeting["method"]>, string> = {
  EMAIL: "Email",
  PHONE: "Phone",
  WHATSAPP: "WhatsApp",
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
};

const STATUS_VARIANT: Record<SalesLeadMeeting["status"], NonNullable<BadgeProps["variant"]>> = {
  SCHEDULED: "default",
  COMPLETED: "success",
  CANCELLED: "outline",
  NO_SHOW: "destructive",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Read-only - admin schedules, the client sees it here instead of hunting through email. */
function ClientMeetingList({ meetings }: { meetings: SalesLeadMeeting[] }) {
  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No meetings scheduled yet"
        description="Once a meeting is set up to discuss your project, it'll show up here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {meetings.map((meeting) => (
        <li key={meeting.id}>
          <Card>
            <CardContent className="flex flex-col gap-1.5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground text-sm font-medium">{formatDateTime(meeting.scheduledAt)}</span>
                <Badge variant={STATUS_VARIANT[meeting.status]}>{meeting.status.replaceAll("_", " ")}</Badge>
              </div>
              {meeting.method && <span className="text-muted-foreground text-xs">{METHOD_LABEL[meeting.method]}</span>}
              {meeting.meetingLink && meeting.status === "SCHEDULED" && (
                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                  Join meeting
                </a>
              )}
              {meeting.notes && <p className="text-muted-foreground text-sm">{meeting.notes}</p>}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export { ClientMeetingList };
