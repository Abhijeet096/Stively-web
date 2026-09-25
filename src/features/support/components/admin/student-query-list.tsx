"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/sections/empty-state";
import { resolveStudentQuery } from "../../actions/support-actions";
import type { StudentQueryForAdmin } from "../../server/queries";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function ResolveButton({ queryId }: { queryId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleClick() {
    setIsPending(true);
    await resolveStudentQuery(queryId);
    setIsPending(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" loading={isPending} onClick={handleClick}>
      Mark resolved
    </Button>
  );
}

/** Never mixed with Lead-pipeline UI (admin/leads, admin/sales-crm/leads) - a student query has no stage, no owner to claim, no qualification to do, just a message and a resolved/open state. */
function StudentQueryList({ queries }: { queries: StudentQueryForAdmin[] }) {
  if (queries.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareText}
        title="No support queries"
        description="Messages students send from /student/support will show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {queries.map((query) => (
        <div key={query.id} className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">{query.student.name ?? "Unnamed student"}</span>
              <span className="text-muted-foreground text-xs">{query.student.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={query.status === "OPEN" ? "warning" : "success"}>{query.status}</Badge>
              <span className="text-muted-foreground text-xs">{formatDateTime(query.createdAt)}</span>
            </div>
          </div>

          <p className="text-foreground text-sm whitespace-pre-line text-pretty">{query.message}</p>

          {query.status === "OPEN" ? (
            <div className="flex justify-end">
              <ResolveButton queryId={query.id} />
            </div>
          ) : (
            <p className="text-muted-foreground text-right text-xs">
              Resolved{query.resolvedBy?.name ? ` by ${query.resolvedBy.name}` : ""}
              {query.resolvedAt ? ` · ${formatDateTime(query.resolvedAt)}` : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export { StudentQueryList };
