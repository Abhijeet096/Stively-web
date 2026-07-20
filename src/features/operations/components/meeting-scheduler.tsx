"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PreferredContactMethod } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { scheduleMeeting } from "../actions/operation-actions";

const METHOD_LABEL: Record<PreferredContactMethod, string> = {
  EMAIL: "Email",
  PHONE: "Phone",
  WHATSAPP: "WhatsApp",
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
};

/** A real scheduling record, not a calendar integration - see prisma/schema.prisma's Meeting comment. */
function MeetingScheduler({ operationItemId }: { operationItemId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [method, setMethod] = React.useState<PreferredContactMethod | undefined>();
  const [notes, setNotes] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);
    const result = await scheduleMeeting(operationItemId, { scheduledAt, method, notes: notes || undefined });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setScheduledAt("");
    setNotes("");
    router.refresh();
  }

  return (
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
            <Label htmlFor="meeting-time">Date &amp; time</Label>
            <Input
              id="meeting-time"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-method">Method</Label>
            <Select value={method} onValueChange={(value) => setMethod(value as PreferredContactMethod)}>
              <SelectTrigger id="meeting-method">
                <SelectValue placeholder="Choose a method" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PreferredContactMethod).map((value) => (
                  <SelectItem key={value} value={value}>
                    {METHOD_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-notes">Notes (optional)</Label>
            <Textarea id="meeting-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
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
  );
}

export { MeetingScheduler };
