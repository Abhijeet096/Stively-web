"use client";

import { useActionState } from "react";
import type { TeamMember } from "@prisma/client";

import { reassignOwner } from "@/actions/crm";
import type { ActionResult } from "@/actions/leads";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

const REASON_OPTIONS: { value: string; label: string }[] = [
  { value: "MANUAL_OVERRIDE", label: "Manual override" },
  { value: "UNAVAILABLE", label: "Owner unavailable" },
  { value: "SLA_BREACH", label: "SLA breach" },
];

/**
 * Reassignment is a deliberate, committal action - unlike status/priority
 * updates (which happen constantly and benefit from staying inline), this
 * is exactly the kind of action worth a confirming modal, per this
 * task's "Reuse: ... Dialogs" instruction.
 */
function LeadOwnerPanel({
  leadId,
  currentOwner,
  teamMembers,
}: {
  leadId: string;
  currentOwner: TeamMember | null;
  teamMembers: TeamMember[];
}) {
  const reassignWithId = reassignOwner.bind(null, leadId);
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    reassignWithId,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Owner</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <span className="text-foreground min-w-0 truncate text-sm">
          {currentOwner?.name ?? "Unassigned"}
        </span>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              Reassign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reassign owner</DialogTitle>
              <DialogDescription>
                The current assignment stays in history - reassigning creates a new one, per Lead
                Intake v1.2&apos;s append-only ownership log.
              </DialogDescription>
            </DialogHeader>

            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newOwnerId">New owner</Label>
                <Select name="newOwnerId">
                  <SelectTrigger id="newOwnerId">
                    <SelectValue placeholder="Choose a team member" />
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
                <Label htmlFor="reason">Reason</Label>
                <Select name="reason" defaultValue="MANUAL_OVERRIDE">
                  <SelectTrigger id="reason">
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

              {state?.success === false && (
                <p className="text-destructive text-sm">{state.error}</p>
              )}

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" loading={isPending}>
                  Confirm reassignment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export { LeadOwnerPanel };
