"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { completeFollowUp, rescheduleFollowUp } from "../../actions/follow-up-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { SALES_FOLLOW_UP_TYPE_LABEL } from "../../lib/labels";
import type { FollowUpWithLead } from "../../server/queries";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function FollowUpRow({ followUp }: { followUp: FollowUpWithLead }) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [rescheduling, setRescheduling] = React.useState(false);
  const [newDueAt, setNewDueAt] = React.useState("");
  const [isReschedulePending, setIsReschedulePending] = React.useState(false);

  async function handleComplete() {
    setIsCompleting(true);
    await completeFollowUp(followUp.id);
    setIsCompleting(false);
    router.refresh();
  }

  async function handleReschedule() {
    if (!newDueAt) return;
    setIsReschedulePending(true);
    const result = await rescheduleFollowUp({ followUpId: followUp.id, dueAt: new Date(newDueAt) });
    setIsReschedulePending(false);
    if (result.success) {
      setRescheduling(false);
      router.refresh();
    }
  }

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/sales/leads/${followUp.salesLeadId}`} className="text-foreground text-sm font-medium hover:underline">
          {followUp.salesLead.businessName}
        </Link>
        <span className="text-muted-foreground text-xs">{formatDateTime(followUp.dueAt)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{SALES_FOLLOW_UP_TYPE_LABEL[followUp.type]}</Badge>
        {followUp.notes && <span className="text-muted-foreground text-xs">{followUp.notes}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" loading={isCompleting} onClick={handleComplete}>
          Mark complete
        </Button>
        {rescheduling ? (
          <div className="flex items-center gap-2">
            <Input type="datetime-local" value={newDueAt} onChange={(e) => setNewDueAt(e.target.value)} className="h-8 text-xs" />
            <Button size="sm" variant="outline" loading={isReschedulePending} disabled={!newDueAt} onClick={handleReschedule}>
              Confirm
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setRescheduling(true)}>
            Reschedule
          </Button>
        )}
      </div>
    </li>
  );
}

function FollowUpBucketSection({ title, followUps }: { title: string; followUps: FollowUpWithLead[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-foreground text-sm font-semibold">
        {title} <span className="text-muted-foreground font-normal">({followUps.length})</span>
      </h3>
      <Card>
        <CardContent>
          {followUps.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nothing here" description="No follow-ups in this bucket." />
          ) : (
            <ul className="divide-border divide-y">
              {followUps.map((f) => (
                <FollowUpRow key={f.id} followUp={f} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { FollowUpBucketSection };
