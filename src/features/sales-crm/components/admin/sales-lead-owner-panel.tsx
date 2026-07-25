"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { TeamMember } from "@prisma/client";

import { reassignSalesLead } from "../../actions/sales-lead-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

const REASON_OPTIONS = [
  { value: "MANUAL_OVERRIDE", label: "Manual override" },
  { value: "UNAVAILABLE", label: "Salesperson unavailable" },
  { value: "SLA_BREACH", label: "SLA breach" },
];

/** Same "reassignment is a deliberate, committal action worth a confirming modal" pattern as LeadOwnerPanel/Operations' AssignmentPanel. */
function SalesLeadOwnerPanel({
  salesLeadId,
  currentOwner,
  teamMembers,
}: {
  salesLeadId: string;
  currentOwner: TeamMember | null;
  teamMembers: TeamMember[];
}) {
  const router = useRouter();
  const [assigneeId, setAssigneeId] = React.useState(teamMembers[0]?.id ?? "");
  const [reason, setReason] = React.useState("MANUAL_OVERRIDE");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [open, setOpen] = React.useState(false);

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const result = await reassignSalesLead({ salesLeadId, assigneeId, reason });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salesperson</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <span className="text-foreground min-w-0 truncate text-sm">{currentOwner?.name ?? "Unassigned"}</span>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              Reassign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reassign lead</DialogTitle>
              <DialogDescription>
                The current assignment stays in the history - reassigning creates a new one rather than overwriting it.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-assignee">New salesperson</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger id="new-assignee">
                    <SelectValue placeholder="Choose a salesperson" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reassign-reason">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reassign-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleSubmit} loading={isPending} disabled={!assigneeId}>
                  Confirm reassignment
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export { SalesLeadOwnerPanel };
