import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Link as LinkIcon } from "lucide-react";

import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMentorByUserId } from "@/features/mentors/server/queries";
import { SessionTypeBadge, SessionStatusBadge } from "@/features/mentors/components/shared/session-type-badge";
import { SessionStatusControls } from "@/features/mentors/components/mentor/session-status-controls";
import { ATTENDEE_STATUS_LABEL } from "@/features/mentors/lib/session-types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getOwnedSession(id: string, mentorId: string) {
  return prisma.liveSession.findFirst({
    where: { id, mentorId },
    include: { attendees: { include: { student: true } } },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  const session = mentor ? await getOwnedSession(id, mentor.id) : null;
  return { title: session?.title ?? "Session" };
}

export default async function MentorSessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  if (!mentor) notFound();

  const session = await getOwnedSession(id, mentor.id);
  if (!session) notFound();

  return (
    <>
      <SetPageTitle title={session.title} />
      <Container className="py-8">
        <Card>
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <SessionTypeBadge type={session.sessionType} />
                <SessionStatusBadge status={session.status} />
              </div>
              <CardTitle className="font-display">{session.title}</CardTitle>
            </div>
            <SessionStatusControls sessionId={session.id} status={session.status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />
                {session.scheduledAt.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
              </span>
              {session.durationMinutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden="true" />
                  {session.durationMinutes} minutes
                </span>
              )}
            </div>

            {session.meetingUrl && (
              <Button variant="outline" className="w-fit" asChild>
                <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="size-4" aria-hidden="true" />
                  Join meeting
                </a>
              </Button>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-foreground text-sm font-semibold">Attendees</span>
              {session.attendees.map((attendee) => (
                <div key={attendee.id} className="border-border/70 flex items-center justify-between border-b py-1.5 text-sm last:border-b-0">
                  <span>{attendee.student.name}</span>
                  <span className="text-muted-foreground text-xs">{ATTENDEE_STATUS_LABEL[attendee.status]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
