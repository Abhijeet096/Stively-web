"use client";

import { useActionState, useState } from "react";
import type { Lead, LeadStatus, LeadPriority, LostReason } from "@prisma/client";

import { updateLead } from "@/actions/crm";
import type { ActionResult } from "@/actions/leads";
import { STATUS_LABEL } from "@/components/dashboard/lead-status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const PRIORITY_OPTIONS: LeadPriority[] = ["LOW", "MEDIUM", "HIGH"];

const LOST_REASON_OPTIONS: LostReason[] = [
  "FINANCIAL_ISSUE",
  "PARENTS_REJECTED",
  "JOINED_ANOTHER_INSTITUTE",
  "NO_TIME",
  "NOT_ELIGIBLE",
  "BUDGET_ISSUE",
  "COMPETITOR_WON",
  "ALREADY_HIRED_AGENCY",
  "INTERNAL_TEAM",
  "POSTPONED",
  "CANCELLED",
  "NO_RESPONSE",
];

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as LeadStatus[];

/**
 * Updates status, priority, next follow-up date, and (when applicable)
 * lost reason in one submission - src/actions/crm.ts's updateLead then
 * decides which of those actually changed and logs the appropriate
 * LeadHistory event(s) per field, not one generic entry.
 */
function LeadUpdateForm({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const updateWithId = updateLead.bind(null, lead.id);
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateWithId,
    null
  );

  const isLostStatus = status === "LOST" || status === "NOT_INTERESTED";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <Select
          name="status"
          defaultValue={lead.status}
          onValueChange={(v: string) => setStatus(v as LeadStatus)}
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {STATUS_LABEL[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="priority">Priority</Label>
        <Select name="priority" defaultValue={lead.priority}>
          <SelectTrigger id="priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt.charAt(0) + opt.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nextFollowUpAt">Next follow-up date</Label>
        <Input
          id="nextFollowUpAt"
          name="nextFollowUpAt"
          type="date"
          defaultValue={lead.nextFollowUpAt ? lead.nextFollowUpAt.toISOString().slice(0, 10) : ""}
        />
      </div>

      {isLostStatus && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lostReason">Lost reason</Label>
          <Select name="lostReason" defaultValue={lead.lostReason ?? undefined}>
            <SelectTrigger id="lostReason">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {LOST_REASON_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt.replaceAll("_", " ").toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {state?.success === false && <p className="text-destructive text-sm">{state.error}</p>}

      <Button type="submit" loading={isPending}>
        Save changes
      </Button>
    </form>
  );
}

export { LeadUpdateForm };
