"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SalesLeadNote, TeamMember } from "@prisma/client";

import { addSalesLeadNote } from "../../actions/sales-lead-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Create-only, no edit/delete - same convention as LeadNotes. Newest first. */
function SalesLeadNotesPanel({ salesLeadId, notes }: { salesLeadId: string; notes: (SalesLeadNote & { author: TeamMember | null })[] }) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const result = await addSalesLeadNote({ salesLeadId, content });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a note..." rows={3} />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button size="sm" loading={isPending} disabled={!content.trim()} onClick={handleSubmit} className="self-end">
            Add note
          </Button>
        </div>

        {notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No notes yet.</p>
        ) : (
          <ul className="border-border flex flex-col gap-3 border-t pt-4">
            {notes.map((note) => (
              <li key={note.id} className="flex flex-col gap-1">
                <p className="text-foreground text-sm">{note.content}</p>
                <span className="text-muted-foreground text-xs">
                  {note.author?.name ?? "Unknown"} · {formatDateTime(note.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesLeadNotesPanel };
