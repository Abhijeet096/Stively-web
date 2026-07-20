"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { InternalComment, TeamMember } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addInternalComment } from "../actions/operation-actions";

type CommentWithAuthor = InternalComment & { author: TeamMember | null };

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/**
 * Staff-only - never rendered on the customer-facing request/order pages.
 * Create-only, same scope as LeadNotes. Plain text today; a markdown
 * renderer is a display-only upgrade later (see prisma/schema.prisma's
 * InternalComment comment).
 */
function InternalNotesPanel({
  operationItemId,
  comments,
}: {
  operationItemId: string;
  comments: CommentWithAuthor[];
}) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);
    const result = await addInternalComment(operationItemId, { content });
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
        <CardTitle>Internal notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Add a note - visible to staff only..."
            rows={3}
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" size="sm" loading={isPending} disabled={!content.trim()} className="self-end">
            Add note
          </Button>
        </form>

        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No notes yet.</p>
        ) : (
          <ul className="border-border flex flex-col gap-3 border-t pt-4">
            {comments.map((comment) => (
              <li key={comment.id} className="flex flex-col gap-1">
                <p className="text-foreground text-sm whitespace-pre-line">{comment.content}</p>
                <span className="text-muted-foreground text-xs">
                  {formatDateTime(comment.createdAt)}
                  {comment.author && ` · ${comment.author.name}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { InternalNotesPanel };
