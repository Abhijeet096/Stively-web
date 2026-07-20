"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { changeOperationStatus } from "../actions/operation-actions";
import { REQUEST_PIPELINE, getRequestStageLabel, ORDER_PIPELINE, ORDER_STAGE_LABEL } from "../lib/stage-labels";
import type { RequestType } from "@prisma/client";

export interface StatusChangerProps {
  operationItemId: string;
  type: "REQUEST" | "ORDER";
  requestType?: RequestType;
  currentStatus: string;
}

/** Dispatches through changeOperationStatus (../actions/operation-actions.ts), which itself calls the real updateRequestStatus/updateOrderStatusAdmin - this component is just the picker. */
function StatusChanger({ operationItemId, type, requestType, currentStatus }: StatusChangerProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState(currentStatus);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const options =
    type === "REQUEST"
      ? REQUEST_PIPELINE.map((s) => ({ value: s, label: getRequestStageLabel(s, requestType ?? "STUDENT") }))
      : ORDER_PIPELINE.map((s) => ({ value: s, label: ORDER_STAGE_LABEL[s] }));

  async function handleChange(value: string) {
    setStatus(value);
    setIsPending(true);
    setError(undefined);
    const result = await changeOperationStatus(operationItemId, value);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      setStatus(currentStatus);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Select value={status} onValueChange={handleChange}>
        <SelectTrigger disabled={isPending} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

export { StatusChanger };
