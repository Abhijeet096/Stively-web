import { CalendarDays, Clock, Link as LinkIcon } from "lucide-react";
import type { LiveSessionType, LiveSessionStatus } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/sections/empty-state";
import { SessionTypeBadge, SessionStatusBadge } from "./session-type-badge";

export interface SessionListItem {
  id: string;
  title: string;
  sessionType: LiveSessionType;
  status: LiveSessionStatus;
  scheduledAt: Date;
  durationMinutes: number | null;
  meetingUrl: string | null;
  /** e.g. "with Priya Sharma" or "3 students invited" - deliberately a plain string so this component stays decoupled from which role's data shape it's fed. */
  subtitle?: string;
}

function SessionList({ sessions, emptyLabel = "No sessions scheduled" }: { sessions: SessionListItem[]; emptyLabel?: string }) {
  if (sessions.length === 0) {
    return <EmptyState icon={CalendarDays} title={emptyLabel} description="Scheduled sessions will show up here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <SessionTypeBadge type={session.sessionType} />
                <SessionStatusBadge status={session.status} />
              </div>
              <p className="text-foreground font-medium">{session.title}</p>
              {session.subtitle && <p className="text-muted-foreground text-sm">{session.subtitle}</p>}
              <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {new Date(session.scheduledAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                {session.durationMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {session.durationMinutes} min
                  </span>
                )}
              </div>
            </div>
            {session.meetingUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="size-3.5" aria-hidden="true" />
                  Join
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { SessionList };
