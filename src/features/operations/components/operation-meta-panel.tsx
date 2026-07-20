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

/** Priority, due date, and next action - each field saves independently on blur/change, no explicit submit button, matching how a Linear/HubSpot side panel behaves. */
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

  async function handlePriorityChange(value: string) {
    await setPriority(operationItemId, value as OperationPriority);
    router.refresh();
  }

  async function handleDueDateChange(value: string) {
    await setDueDate(operationItemId, value);
    router.refresh();
  }

  async function handleNextActionBlur() {
    if (nextActionValue === (nextAction ?? "")) return;
    await setNextAction(operationItemId, nextActionValue);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta-priority">Priority</Label>
          <Select value={priority} onValueChange={handlePriorityChange}>
            <SelectTrigger id="meta-priority">
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
          <Label htmlFor="meta-due-date">Due date</Label>
          <Input
            id="meta-due-date"
            type="date"
            defaultValue={toDateInputValue(dueDate)}
            onChange={(event) => handleDueDateChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta-next-action">Next action</Label>
          <Input
            id="meta-next-action"
            value={nextActionValue}
            onChange={(event) => setNextActionValue(event.target.value)}
            onBlur={handleNextActionBlur}
            placeholder="What happens next?"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export { OperationMetaPanel };
