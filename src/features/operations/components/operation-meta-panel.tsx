"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { OperationPriority } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { setPriority, setDueDate, setNextAction } from "../actions/operation-actions";
import { PRIORITY_LABEL } from "./operation-priority-badge";

const PRIORITIES: OperationPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

/**
 * Priority, due date, and next action - each field saves independently on
 * blur/change, no explicit submit button, matching how a Linear/HubSpot
 * side panel behaves. Each field tracks its own pending state (same
 * disabled-while-saving pattern as StatusChanger) rather than one shared
 * flag, since saving Priority shouldn't visually block the Due date field.
 */
function OperationMetaPanel({
  operationItemId,
  priority,
  dueDate,
  nextAction,
}: {
  operationItemId: string;
  priority: OperationPriority;
  dueDate: Date | null;
  nextAction: string | null;
}) {
  const router = useRouter();
  const [nextActionValue, setNextActionValue] = React.useState(nextAction ?? "");
  const [savingPriority, setSavingPriority] = React.useState(false);
  const [savingDueDate, setSavingDueDate] = React.useState(false);
  const [savingNextAction, setSavingNextAction] = React.useState(false);

  async function handlePriorityChange(value: string) {
    setSavingPriority(true);
    await setPriority(operationItemId, value as OperationPriority);
    setSavingPriority(false);
    router.refresh();
  }

  async function handleDueDateChange(value: string) {
    setSavingDueDate(true);
    await setDueDate(operationItemId, value);
    setSavingDueDate(false);
    router.refresh();
  }

  async function handleNextActionBlur() {
    if (nextActionValue === (nextAction ?? "")) return;
    setSavingNextAction(true);
    await setNextAction(operationItemId, nextActionValue);
    setSavingNextAction(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta-priority">
            Priority {savingPriority && <span className="text-muted-foreground font-normal">Saving...</span>}
          </Label>
          <Select value={priority} onValueChange={handlePriorityChange}>
            <SelectTrigger id="meta-priority" disabled={savingPriority}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta-due-date">
            Due date {savingDueDate && <span className="text-muted-foreground font-normal">Saving...</span>}
          </Label>
          <Input
            id="meta-due-date"
            type="date"
            defaultValue={toDateInputValue(dueDate)}
            disabled={savingDueDate}
            onChange={(event) => handleDueDateChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta-next-action">
            Next action {savingNextAction && <span className="text-muted-foreground font-normal">Saving...</span>}
          </Label>
          <Input
            id="meta-next-action"
            value={nextActionValue}
            onChange={(event) => setNextActionValue(event.target.value)}
            onBlur={handleNextActionBlur}
            disabled={savingNextAction}
            placeholder="What happens next?"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export { OperationMetaPanel };
