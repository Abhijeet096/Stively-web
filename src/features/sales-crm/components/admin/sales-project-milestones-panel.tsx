"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ProjectMilestone, ProjectMilestoneStatus } from "@prisma/client";

import { createMilestone, updateMilestone, deleteMilestone } from "../../actions/progress-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PROJECT_MILESTONE_STATUS_LABEL, PROJECT_MILESTONE_STATUS_VARIANT } from "../../lib/labels";

const STATUSES: ProjectMilestoneStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];

function MilestoneRow({ milestone }: { milestone: ProjectMilestone }) {
  const router = useRouter();
  const [status, setStatus] = React.useState(milestone.status);
  const [percent, setPercent] = React.useState(milestone.percentComplete?.toString() ?? "");
  const [isPending, setIsPending] = React.useState(false);

  async function handleStatusChange(value: string) {
    const next = value as ProjectMilestoneStatus;
    setStatus(next);
    setIsPending(true);
    await updateMilestone({ milestoneId: milestone.id, status: next, percentComplete: percent ? Number(percent) : undefined });
    setIsPending(false);
    router.refresh();
  }

  async function handlePercentBlur() {
    if (status !== "IN_PROGRESS") return;
    setIsPending(true);
    await updateMilestone({ milestoneId: milestone.id, status, percentComplete: percent ? Number(percent) : undefined });
    setIsPending(false);
    router.refresh();
  }

  async function handleDelete() {
    setIsPending(true);
    await deleteMilestone({ milestoneId: milestone.id });
    setIsPending(false);
    router.refresh();
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2">
        <Badge variant={PROJECT_MILESTONE_STATUS_VARIANT[status]}>{PROJECT_MILESTONE_STATUS_LABEL[status]}</Badge>
        <span className="text-foreground text-sm font-medium">{milestone.label}</span>
      </div>
      <div className="flex items-center gap-2">
        {status === "IN_PROGRESS" && (
          <Input
            type="number"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            onBlur={handlePercentBlur}
            placeholder="%"
            className="h-8 w-16"
            disabled={isPending}
          />
        )}
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger disabled={isPending} className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {PROJECT_MILESTONE_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="icon" variant="ghost" disabled={isPending} onClick={handleDelete} aria-label="Delete milestone">
          <Trash2 className="text-muted-foreground size-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

/** The client-facing interactive timeline's source of truth - admin appends milestones (order = creation order) and updates their status/percent here. */
function SalesProjectMilestonesPanel({ salesProjectId, milestones }: { salesProjectId: string; milestones: ProjectMilestone[] }) {
  const router = useRouter();
  const [label, setLabel] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleAdd() {
    setIsPending(true);
    setError(undefined);
    const result = await createMilestone({ salesProjectId, label });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setLabel("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline & milestones</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Design approval, Development, Deployment..." />
          <Button size="sm" loading={isPending} disabled={!label.trim()} onClick={handleAdd}>
            Add
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}

        {milestones.length === 0 ? (
          <p className="text-muted-foreground text-sm">No milestones added yet.</p>
        ) : (
          <ul className="border-border divide-border divide-y border-t">
            {milestones.map((milestone) => (
              <MilestoneRow key={milestone.id} milestone={milestone} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesProjectMilestonesPanel };
