import { ListChecks } from "lucide-react";
import type { ProjectUpdate } from "@prisma/client";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Read-only mirror of SalesProjectUpdatesPanel's list half - the client never posts, only reads what the team shares. */
function ClientProgressFeed({ updates }: { updates: ProjectUpdate[] }) {
  if (updates.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
        <ListChecks className="size-6" aria-hidden="true" />
        <p>No progress updates yet - your team will post here as work happens.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-5">
      {updates.map((update) => (
        <li key={update.id} className="border-border flex flex-col gap-1.5 border-b pb-5 last:border-b-0 last:pb-0">
          <span className="text-muted-foreground text-xs">{formatDateTime(update.createdAt)}</span>
          {update.completedItems.length > 0 && (
            <ul className="text-foreground list-inside list-disc text-sm">
              {update.completedItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
          {update.plannedNextItems.length > 0 && (
            <div className="text-muted-foreground text-sm">
              <span className="font-medium">Coming up:</span> {update.plannedNextItems.join(", ")}
            </div>
          )}
          {update.blockers && <p className="text-destructive text-sm">Note: {update.blockers}</p>}
        </li>
      ))}
    </ul>
  );
}

export { ClientProgressFeed };
