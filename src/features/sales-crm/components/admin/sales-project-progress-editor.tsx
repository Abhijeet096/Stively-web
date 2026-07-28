"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { updateProjectProgress } from "../../actions/progress-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

/** Overall completion + warranty window shown on the client's project card/dashboard - admin-set, never derived from milestones. */
function SalesProjectProgressEditor({
  salesProjectId,
  progressPercent,
  warrantyExpiresAt,
}: {
  salesProjectId: string;
  progressPercent: number;
  warrantyExpiresAt: Date | null;
}) {
  const router = useRouter();
  const [percent, setPercent] = React.useState(progressPercent.toString());
  const [warranty, setWarranty] = React.useState(toDateInputValue(warrantyExpiresAt));
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSave() {
    setIsPending(true);
    setError(undefined);
    const result = await updateProjectProgress({
      salesProjectId,
      progressPercent: Number(percent),
      warrantyExpiresAt: warranty ? new Date(warranty) : null,
    });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="progress-percent">Overall progress (%)</Label>
          <Input id="progress-percent" type="number" min={0} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="warranty-date">Warranty expires</Label>
          <Input id="warranty-date" type="date" value={warranty} onChange={(e) => setWarranty(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button size="sm" loading={isPending} onClick={handleSave} className="self-end">
        Save
      </Button>
    </div>
  );
}

export { SalesProjectProgressEditor };
