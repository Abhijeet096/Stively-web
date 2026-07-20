"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createMentorSession } from "../../actions/session-actions";
import { MENTOR_SESSION_TYPES, SESSION_TYPE_LABEL, SESSION_PROVIDER_LABEL } from "../../lib/session-types";
import type { LiveSessionType, LiveSessionProvider } from "@prisma/client";

interface StudentOption {
  studentId: string;
  name: string | null;
}

function SessionSchedulerForm({ students }: { students: StudentOption[] }) {
  const router = useRouter();
  const [sessionType, setSessionType] = React.useState<LiveSessionType>("ONE_ON_ONE");
  const [title, setTitle] = React.useState("");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [durationMinutes, setDurationMinutes] = React.useState("");
  const [meetingUrl, setMeetingUrl] = React.useState("");
  const [provider, setProvider] = React.useState<LiveSessionProvider | undefined>();
  const [attendeeIds, setAttendeeIds] = React.useState<string[]>([]);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  function toggleAttendee(studentId: string) {
    setAttendeeIds((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
  }

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const result = await createMentorSession({
      sessionType,
      title,
      scheduledAt,
      durationMinutes: durationMinutes || undefined,
      meetingUrl: meetingUrl || undefined,
      provider,
      attendeeStudentIds: attendeeIds,
    });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setTitle("");
    setScheduledAt("");
    setDurationMinutes("");
    setMeetingUrl("");
    setAttendeeIds([]);
    router.refresh();
  }

  if (students.length === 0) {
    return <p className="text-muted-foreground text-sm">Assign yourself some students before scheduling a session.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="session-type" label="Session type">
          <Select value={sessionType} onValueChange={(value) => setSessionType(value as LiveSessionType)}>
            <SelectTrigger id="session-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MENTOR_SESSION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {SESSION_TYPE_LABEL[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField id="session-title" label="Title">
          <Input id="session-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Career check-in" />
        </FormField>

        <FormField id="session-time" label="Date and time">
          <Input
            id="session-time"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </FormField>

        <FormField id="session-duration" label="Duration (minutes)" optional>
          <Input
            id="session-duration"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </FormField>

        <FormField id="session-provider" label="Provider" optional>
          <Select
            value={provider ?? "__none"}
            onValueChange={(value) => setProvider(value === "__none" ? undefined : (value as LiveSessionProvider))}
          >
            <SelectTrigger id="session-provider">
              <SelectValue placeholder="Choose..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">None</SelectItem>
              {(Object.keys(SESSION_PROVIDER_LABEL) as LiveSessionProvider[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {SESSION_PROVIDER_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField id="session-url" label="Meeting link" optional>
          <Input
            id="session-url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://meet.google.com/..."
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-foreground text-sm font-medium">Invite students</span>
        <div className="flex flex-col gap-2">
          {students.map((student) => (
            <label key={student.studentId} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={attendeeIds.includes(student.studentId)}
                onChange={() => toggleAttendee(student.studentId)}
                className="border-input accent-primary size-4 rounded"
              />
              {student.name}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button onClick={handleSubmit} loading={isPending} disabled={!title || !scheduledAt || attendeeIds.length === 0}>
        Schedule session
      </Button>
    </div>
  );
}

export { SessionSchedulerForm };
