"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PreferredContactMethod } from "@prisma/client";
import type { SalesLeadMeeting, TeamMember } from "@prisma/client";

import { scheduleSalesLeadMeeting, updateSalesLeadMeetingStatus } from "../../actions/meeting-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { CalendarClock } from "lucide-react";

const METHOD_LABEL: Record<PreferredContactMethod, string> = {
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

/** The pre-sale meeting scheduler + list - real scheduling record, not a calendar integration, same discipline as operations/components/meeting-scheduler.tsx. Meetings happen before a SalesProject exists, so this lives on the lead, not the project. */
function SalesLeadMeetingPanel({ salesLeadId, meetings }: { salesLeadId: string; meetings: (SalesLeadMeeting & { scheduledBy: Pick<TeamMember, "name"> | null })[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [method, setMethod] = React.useState<PreferredContactMethod | "">("");
  const [meetingLink, setMeetingLink] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [statusPending, setStatusPending] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);
    const result = await scheduleSalesLeadMeeting({
      salesLeadId,
      scheduledAt,
      method: method || undefined,
      meetingLink: meetingLink || undefined,
      notes: notes || undefined,
    });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setScheduledAt("");
    setMethod("");
    setMeetingLink("");
    setNotes("");
    router.refresh();
  }

  async function handleStatusChange(meetingId: string, status: SalesLeadMeeting["status"]) {
    setStatusPending(meetingId);
    await updateSalesLeadMeetingStatus({ meetingId, status });
    setStatusPending(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Meetings</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Schedule meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule a meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sl-meeting-time">Date &amp; time</Label>
                <Input id="sl-meeting-time" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sl-meeting-method">Method</Label>
                <select
                  id="sl-meeting-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PreferredContactMethod | "")}
                  className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm"
                >
                  <option value="">Choose a method</option>
                  {Object.values(PreferredContactMethod).map((value) => (
                    <option key={value} value={value}>
                      {METHOD_LABEL[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sl-meeting-link">Meeting link (optional)</Label>
                <Input id="sl-meeting-link" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sl-meeting-notes">Notes (optional)</Label>
                <Textarea id="sl-meeting-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" loading={isPending}>
                  Schedule
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {meetings.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No meetings scheduled yet" description="Schedule one once negotiation is on track." />
        ) : (
          meetings.map((meeting) => (
            <div key={meeting.id} className="border-border flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground text-sm font-medium">{formatDateTime(meeting.scheduledAt)}</span>
                <Badge variant={STATUS_VARIANT[meeting.status]}>{meeting.status.replaceAll("_", " ")}</Badge>
              </div>
              <span className="text-muted-foreground text-xs">
                {meeting.method ? METHOD_LABEL[meeting.method] : "No method set"}
                {meeting.scheduledBy?.name ? ` · Scheduled by ${meeting.scheduledBy.name}` : ""}
              </span>
              {meeting.meetingLink && (
                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                  {meeting.meetingLink}
                </a>
              )}
              {meeting.notes && <p className="text-muted-foreground text-sm">{meeting.notes}</p>}
              {meeting.status === "SCHEDULED" && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={statusPending === meeting.id}
                    disabled={!!statusPending}
                    onClick={() => handleStatusChange(meeting.id, "COMPLETED")}
                  >
                    Mark completed
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={statusPending === meeting.id}
                    disabled={!!statusPending}
                    onClick={() => handleStatusChange(meeting.id, "CANCELLED")}
                  >
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

export { SalesLeadMeetingPanel };
