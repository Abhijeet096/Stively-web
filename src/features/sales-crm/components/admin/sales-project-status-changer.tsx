"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SalesProjectStatus } from "@prisma/client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateProjectStatus } from "../../actions/project-actions";
import { SALES_PROJECT_STATUS_LABEL } from "../../lib/labels";

const STATUSES: SalesProjectStatus[] = ["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"];

function SalesProjectStatusChanger({ salesProjectId, currentStatus }: { salesProjectId: string; currentStatus: SalesProjectStatus }) {
  const router = useRouter();
  const [status, setStatus] = React.useState(currentStatus);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleChange(value: string) {
    setStatus(value as SalesProjectStatus);
    setIsPending(true);
    setError(undefined);
    const result = await updateProjectStatus({ salesProjectId, status: value });
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
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {SALES_PROJECT_STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

export { SalesProjectStatusChanger };
