"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ProjectUpdate, TeamMember } from "@prisma/client";

import { postProjectUpdate } from "../../actions/progress-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** One line per completed/planned item - split on newline into the schema's string[] fields. Create-only, newest first, same convention as SalesLeadNotesPanel. */
function SalesProjectUpdatesPanel({
  salesProjectId,
  updates,
}: {
  salesProjectId: string;
  updates: (ProjectUpdate & { postedBy: Pick<TeamMember, "name"> | null })[];
}) {
  const router = useRouter();
  const [completed, setCompleted] = React.useState("");
  const [planned, setPlanned] = React.useState("");
  const [blockers, setBlockers] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const result = await postProjectUpdate({
      salesProjectId,
      completedItems: completed.split("\n").map((line) => line.trim()).filter(Boolean),
      plannedNextItems: planned.split("\n").map((line) => line.trim()).filter(Boolean),
      blockers: blockers.trim() || undefined,
    });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCompleted("");
    setPlanned("");
    setBlockers("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress updates</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-medium">Completed today (one per line)</label>
            <Textarea value={completed} onChange={(e) => setCompleted(e.target.value)} placeholder={"Set up homepage layout\nIntegrated contact form"} rows={3} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-medium">Planned next (one per line)</label>
            <Textarea value={planned} onChange={(e) => setPlanned(e.target.value)} placeholder={"Wire up payment page\nMobile responsive pass"} rows={3} />
          </div>
        </div>
        <Textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} placeholder="Blockers (optional)" rows={2} />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button size="sm" loading={isPending} disabled={!completed.trim()} onClick={handleSubmit} className="self-end">
          Post update
        </Button>

        {updates.length === 0 ? (
          <p className="text-muted-foreground text-sm">No updates posted yet.</p>
        ) : (
          <ul className="border-border flex flex-col gap-4 border-t pt-4">
            {updates.map((update) => (
              <li key={update.id} className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  {update.postedBy?.name ?? "Unknown"} · {formatDateTime(update.createdAt)}
                </span>
                {update.completedItems.length > 0 && (
                  <ul className="text-foreground list-inside list-disc text-sm">
                    {update.completedItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
                {update.plannedNextItems.length > 0 && (
                  <div className="text-muted-foreground text-sm">
                    <span className="font-medium">Next:</span> {update.plannedNextItems.join(", ")}
                  </div>
                )}
                {update.blockers && <p className="text-destructive text-sm">Blocker: {update.blockers}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesProjectUpdatesPanel };
