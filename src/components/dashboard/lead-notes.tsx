"use client";

import { useActionState } from "react";
import type { LeadNote } from "@prisma/client";

import { addLeadNote } from "@/actions/crm";
import type { ActionResult } from "@/actions/leads";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/**
 * Create-only, per this task's explicit scope - no edit, no delete
 * actions exist for notes, so none are wired up here either. Newest
 * first, matching getLeadNotes' default order (src/lib/queries/leads.ts).
 */
function LeadNotes({ leadId, notes }: { leadId: string; notes: LeadNote[] }) {
  const addNoteWithId = addLeadNote.bind(null, leadId);
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    addNoteWithId,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={formAction} className="flex flex-col gap-2">
          <Textarea name="content" placeholder="Add a note..." rows={3} required />
          {state?.success === false && <p className="text-destructive text-sm">{state.error}</p>}
          <Button type="submit" size="sm" loading={isPending} className="self-end">
            Add note
          </Button>
        </form>

        {notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No notes yet.</p>
        ) : (
          <ul className="border-border flex flex-col gap-3 border-t pt-4">
            {notes.map((note) => (
              <li key={note.id} className="flex flex-col gap-1">
                <p className="text-foreground text-sm">{note.content}</p>
                <span className="text-muted-foreground text-xs">
                  {formatDateTime(note.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { LeadNotes };
