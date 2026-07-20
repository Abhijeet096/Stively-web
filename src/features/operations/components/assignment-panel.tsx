"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { TeamMember, AssignmentRole } from "@prisma/client";

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
import { assignOperationItem } from "../actions/operation-actions";
import { ASSIGNMENT_ROLE_LABEL, ELIGIBLE_TEAM_MEMBER_ROLES } from "../lib/assignment-labels";

const ASSIGNMENT_ROLES: AssignmentRole[] = ["COUNSELLOR", "SALES", "SUPPORT", "MENTOR"];

/**
 * Generalizes src/components/dashboard/lead-owner-panel.tsx's Dialog-based
 * reassign flow over OperationItem instead of Lead - same "reassignment is
 * a deliberate, committal action worth a confirming modal" reasoning. The
 * team-member picker filters to whoever is eligible for the chosen
 * AssignmentRole (../lib/assignment-labels.ts) - MENTOR's list is empty
 * today (no TeamMemberRole exists for it yet), so choosing it here
 * honestly shows no one to assign, not a broken picker.
 */
function AssignmentPanel({
  operationItemId,
  currentAssignee,
  teamMembers,
}: {
  operationItemId: string;
  currentAssignee: TeamMember | null;
  teamMembers: TeamMember[];
}) {
  const router = useRouter();
  const [role, setRole] = React.useState<AssignmentRole>("COUNSELLOR");
  const [assigneeId, setAssigneeId] = React.useState<string | undefined>();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [open, setOpen] = React.useState(false);

  const eligible = teamMembers.filter((member) => ELIGIBLE_TEAM_MEMBER_ROLES[role].includes(member.role));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!assigneeId) {
      setError("Choose a team member");
      return;
    }
    setIsPending(true);
    setError(undefined);
    const result = await assignOperationItem(operationItemId, { assigneeId, role });
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
        <CardTitle>Assignment</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <span className="text-foreground min-w-0 truncate text-sm">
          {currentAssignee?.name ?? "Unassigned"}
        </span>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              {currentAssignee ? "Reassign" : "Assign"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign this item</DialogTitle>
              <DialogDescription>
                The current assignment stays in history - assigning creates a new one, same
                append-only pattern as Lead ownership.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assignment-role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => {
                    setRole(value as AssignmentRole);
                    setAssigneeId(undefined);
                  }}
                >
                  <SelectTrigger id="assignment-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ASSIGNMENT_ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assignment-member">Team member</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger id="assignment-member">
                    <SelectValue placeholder={eligible.length === 0 ? "No one eligible yet" : "Choose a team member"} />
                  </SelectTrigger>
                  <SelectContent>
                    {eligible.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
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
                <Button type="submit" loading={isPending} disabled={eligible.length === 0}>
                  Confirm assignment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export { AssignmentPanel };
