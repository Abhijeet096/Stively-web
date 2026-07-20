import Link from "next/link";
import { Radio } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LiveSession } from "@prisma/client";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** A real scheduling record (no video integration - see LiveSession's schema comment). Shows the join link only once staff have set one. */
function BlockLiveSession({ session }: { session: LiveSession }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Radio className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-medium">{session.title}</span>
            <span className="text-muted-foreground text-sm">{formatDateTime(session.scheduledAt)}</span>
          </div>
        </div>
        {session.meetingUrl ? (
          <Button size="sm" asChild>
            <Link href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
              Join
            </Link>
          </Button>
        ) : (
          <Badge variant="outline">{session.status === "SCHEDULED" ? "Scheduled" : session.status}</Badge>
        )}
      </CardContent>
    </Card>
  );
}

export { BlockLiveSession };
