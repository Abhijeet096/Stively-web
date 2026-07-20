import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getMentorByUserId, getMyAssignedStudents, getMentorSessions } from "@/features/mentors/server/queries";
import { SessionSchedulerForm } from "@/features/mentors/components/mentor/session-scheduler-form";
import { SessionList, type SessionListItem } from "@/features/mentors/components/shared/session-list";

export const metadata: Metadata = { title: "Sessions" };

export default async function MentorSessionsPage() {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);

  const [students, sessions] = mentor
    ? await Promise.all([getMyAssignedStudents(mentor.id), getMentorSessions(mentor.id)])
    : [[], []];

  const sessionItems: SessionListItem[] = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    sessionType: session.sessionType,
    status: session.status,
    scheduledAt: session.scheduledAt,
    durationMinutes: session.durationMinutes,
    meetingUrl: session.meetingUrl,
    subtitle: `${session.attendees.length} student${session.attendees.length === 1 ? "" : "s"} invited`,
  }));

  return (
    <>
      <SetPageTitle title="Sessions" />
      <Container className="flex flex-col gap-8 py-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Sessions</h2>

        <Card>
          <CardHeader>
            <CardTitle>Schedule a session</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionSchedulerForm students={students.map((a) => ({ studentId: a.studentId, name: a.student.name }))} />
          </CardContent>
        </Card>

        <SessionList sessions={sessionItems} />
      </Container>
    </>
  );
}
