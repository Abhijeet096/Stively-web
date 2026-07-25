"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SalesLeadStatus } from "@prisma/client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateSalesLead } from "../../actions/sales-lead-actions";
import { SALES_LEAD_STATUS_LABEL } from "../../lib/labels";

const STATUSES: SalesLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
  "ON_HOLD",
];

function SalesLeadStatusChanger({ salesLeadId, currentStatus }: { salesLeadId: string; currentStatus: SalesLeadStatus }) {
  const router = useRouter();
  const [status, setStatus] = React.useState(currentStatus);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleChange(value: string) {
    setStatus(value as SalesLeadStatus);
    setIsPending(true);
    setError(undefined);
    const result = await updateSalesLead(salesLeadId, { status: value });
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
              {SALES_LEAD_STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

export { SalesLeadStatusChanger };
