"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LostReason } from "@prisma/client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { updateSalesLead } from "../../actions/sales-lead-actions";
import { LOST_REASON_LABEL } from "../../lib/lost-reason-labels";

const REASONS = Object.keys(LOST_REASON_LABEL) as LostReason[];

/** Only rendered when a lead's status is LOST - feeds the Lost Lead Analysis report. */
function SalesLeadLostReason({ salesLeadId, currentReason }: { salesLeadId: string; currentReason: LostReason | null }) {
  const router = useRouter();
  const [reason, setReason] = React.useState(currentReason ?? "");
  const [isPending, setIsPending] = React.useState(false);

  async function handleChange(value: string) {
    setReason(value);
    setIsPending(true);
    const result = await updateSalesLead(salesLeadId, { lostReason: value });
    setIsPending(false);
    if (!result.success) {
      setReason(currentReason ?? "");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      <Label htmlFor="lost-reason" className="text-muted-foreground text-xs">
        Reason lost
      </Label>
      <Select value={reason} onValueChange={handleChange}>
        <SelectTrigger id="lost-reason" disabled={isPending} className="w-full">
          <SelectValue placeholder="Why was this lost?" />
        </SelectTrigger>
        <SelectContent>
          {REASONS.map((r) => (
            <SelectItem key={r} value={r}>
              {LOST_REASON_LABEL[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { SalesLeadLostReason };
