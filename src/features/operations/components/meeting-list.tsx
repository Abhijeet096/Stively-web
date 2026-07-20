"use client";

import { useRouter } from "next/navigation";
import type { Meeting } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateMeetingStatus } from "../actions/operation-actions";
import { MeetingScheduler } from "./meeting-scheduler";

const STATUS_VARIANT: Record<Meeting["status"], NonNullable<BadgeProps["variant"]>> = {
  SCHEDULED: "default",
  COMPLETED: "success",
  CANCELLED: "outline",
  NO_SHOW: "destructive",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function MeetingList({ operationItemId, meetings }: { operationItemId: string; meetings: Meeting[] }) {
  const router = useRouter();

  async function handleStatusChange(meetingId: string, status: Meeting["status"]) {
    await updateMeetingStatus(meetingId, status);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Meetings</CardTitle>
        <MeetingScheduler operationItemId={operationItemId} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {meetings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No meetings scheduled yet.</p>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting.id} className="border-border flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground text-sm font-medium">{formatDateTime(meeting.scheduledAt)}</span>
                <Badge variant={STATUS_VARIANT[meeting.status]}>{meeting.status.replaceAll("_", " ")}</Badge>
              </div>
              {meeting.notes && <p className="text-muted-foreground text-sm">{meeting.notes}</p>}
              {meeting.status === "SCHEDULED" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(meeting.id, "COMPLETED")}>
                    Mark completed
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleStatusChange(meeting.id, "CANCELLED")}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export { MeetingList };
