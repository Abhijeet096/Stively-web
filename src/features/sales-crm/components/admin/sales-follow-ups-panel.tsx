"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import type { SalesFollowUp, TeamMember, SalesFollowUpType } from "@prisma/client";

import { createFollowUp, completeFollowUp, rescheduleFollowUp } from "../../actions/follow-up-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SALES_FOLLOW_UP_TYPE_LABEL, SALES_FOLLOW_UP_STATUS_LABEL, SALES_FOLLOW_UP_STATUS_VARIANT } from "../../lib/labels";

const TYPES: SalesFollowUpType[] = ["CALL", "WHATSAPP", "EMAIL", "MEETING", "OTHER"];

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function RescheduleRow({ followUpId, onDone }: { followUpId: string; onDone: () => void }) {
  const [dueAt, setDueAt] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit() {
    if (!dueAt) return;
    setIsPending(true);
    setError(undefined);
    const result = await rescheduleFollowUp({ followUpId, dueAt: new Date(dueAt) });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <div className="flex items-center gap-2">
      <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="h-8 text-xs" />
      <Button size="sm" variant="outline" loading={isPending} disabled={!dueAt} onClick={handleSubmit}>
        Confirm
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function SalesFollowUpsPanel({
  salesLeadId,
  followUps,
  teamMembers,
  defaultAssigneeId,
}: {
  salesLeadId: string;
  followUps: (SalesFollowUp & { assignedTo: TeamMember })[];
  teamMembers: TeamMember[];
  defaultAssigneeId?: string;
}) {
  const router = useRouter();
  const [assignedToId, setAssignedToId] = React.useState(defaultAssigneeId ?? teamMembers[0]?.id ?? "");
  const [type, setType] = React.useState<SalesFollowUpType>("CALL");
  const [dueAt, setDueAt] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [reschedulingId, setReschedulingId] = React.useState<string | null>(null);
  const [completingId, setCompletingId] = React.useState<string | null>(null);

  async function handleCreate() {
    setIsPending(true);
    setError(undefined);
    const result = await createFollowUp({ salesLeadId, assignedToId, type, dueAt: new Date(dueAt), notes: notes || undefined });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDueAt("");
    setNotes("");
    router.refresh();
  }

  async function handleComplete(id: string) {
    setCompletingId(id);
    await completeFollowUp(id);
    setCompletingId(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-ups</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fu-assignee">Assigned to</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger id="fu-assignee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fu-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as SalesFollowUpType)}>
              <SelectTrigger id="fu-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {SALES_FOLLOW_UP_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fu-due">Due</Label>
            <Input id="fu-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
        </div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button size="sm" loading={isPending} disabled={!assignedToId || !dueAt} onClick={handleCreate} className="self-end">
          Schedule follow-up
        </Button>

        {followUps.length === 0 ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <CalendarClock className="size-4" aria-hidden="true" />
            No follow-ups yet.
          </p>
        ) : (
          <ul className="border-border flex flex-col gap-3 border-t pt-4">
            {followUps.map((f) => (
              <li key={f.id} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={SALES_FOLLOW_UP_STATUS_VARIANT[f.status]}>{SALES_FOLLOW_UP_STATUS_LABEL[f.status]}</Badge>
                    <span className="text-foreground text-sm font-medium">{SALES_FOLLOW_UP_TYPE_LABEL[f.type]}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{formatDateTime(f.dueAt)}</span>
                </div>
                {f.notes && <p className="text-muted-foreground text-sm">{f.notes}</p>}
                <span className="text-muted-foreground text-xs">Assigned to {f.assignedTo.name}</span>
                {f.status === "PENDING" && (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" loading={completingId === f.id} onClick={() => handleComplete(f.id)}>
                      Mark complete
                    </Button>
                    {reschedulingId === f.id ? (
                      <RescheduleRow followUpId={f.id} onDone={() => { setReschedulingId(null); router.refresh(); }} />
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setReschedulingId(f.id)}>
                        Reschedule
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesFollowUpsPanel };
