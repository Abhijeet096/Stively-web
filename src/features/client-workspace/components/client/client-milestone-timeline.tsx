import { Check, Circle, CircleDot, Milestone } from "lucide-react";
import type { ProjectMilestone } from "@prisma/client";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

const ICON = {
  DONE: Check,
  IN_PROGRESS: CircleDot,
  PENDING: Circle,
} as const;

const ICON_CLASS = {
  DONE: "bg-primary text-primary-foreground border-primary",
  IN_PROGRESS: "border-primary text-primary bg-background",
  PENDING: "border-border text-muted-foreground bg-background",
} as const;

/** Read-only interactive timeline - order and status come straight from SalesProjectMilestonesPanel's admin edits, no client-side interaction. */
function ClientMilestoneTimeline({ milestones }: { milestones: ProjectMilestone[] }) {
  if (milestones.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
        <Milestone className="size-6" aria-hidden="true" />
        <p>No milestones set up yet - your project timeline will appear here.</p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-6">
      {milestones.map((milestone) => {
        const Icon = ICON[milestone.status];
        return (
          <li key={milestone.id} className="flex gap-3">
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${ICON_CLASS[milestone.status]}`}>
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-foreground text-sm font-medium">{milestone.label}</span>
              {milestone.status === "IN_PROGRESS" && milestone.percentComplete != null && (
                <span className="text-muted-foreground text-xs">{milestone.percentComplete}% complete</span>
              )}
              {milestone.status === "DONE" && milestone.completedAt && (
                <span className="text-muted-foreground text-xs">Completed {formatDate(milestone.completedAt)}</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { ClientMilestoneTimeline };
