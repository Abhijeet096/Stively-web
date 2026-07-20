import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import {
  getStudentMentors,
  getStudentSessions,
  getOrCreateConversation,
  getMessages,
} from "@/features/mentors/server/queries";
import { sendMessageToMentorContent } from "@/features/mentors/actions/message-actions";
import { MentorProfileView } from "@/features/mentors/components/student/mentor-profile-view";
import { ConversationPanel } from "@/features/mentors/components/shared/conversation-panel";
import { SessionList, type SessionListItem } from "@/features/mentors/components/shared/session-list";

interface PageProps {
  params: Promise<{ mentorId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mentorId } = await params;
  const user = await requireRole("STUDENT");
  const assignments = await getStudentMentors(user.id);
  const assignment = assignments.find((a) => a.mentorId === mentorId);
  return { title: assignment?.mentor.user.name ?? "Mentor" };
}

export default async function StudentMentorDetailPage({ params }: PageProps) {
  const { mentorId } = await params;
  const user = await requireRole("STUDENT");

  const assignments = await getStudentMentors(user.id);
  const assignment = assignments.find((a) => a.mentorId === mentorId);
  if (!assignment) notFound();

  const [conversation, allSessions] = await Promise.all([
    getOrCreateConversation(mentorId, user.id),
    getStudentSessions(user.id),
  ]);
  const messages = await getMessages(conversation.id);

  const sessionItems: SessionListItem[] = allSessions
    .filter((session) => session.mentorId === mentorId)
    .map((session) => ({
      id: session.id,
      title: session.title,
      sessionType: session.sessionType,
      status: session.status,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      meetingUrl: session.meetingUrl,
    }));

  return (
    <>
      <SetPageTitle title={assignment.mentor.user.name ?? "Mentor"} />
      <Container className="flex flex-col gap-8 py-8">
        <MentorProfileView mentor={assignment.mentor} />

        <div className="flex flex-col gap-3">
          <h3 className="text-foreground text-lg font-semibold">Sessions</h3>
          <SessionList sessions={sessionItems} emptyLabel="No sessions scheduled yet" />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-foreground text-lg font-semibold">Messages</h3>
          <ConversationPanel
            currentUserId={user.id}
            otherPartyName={assignment.mentor.user.name ?? "your mentor"}
            messages={messages}
            onSend={sendMessageToMentorContent.bind(null, mentorId)}
          />
        </div>
      </Container>
    </>
  );
}
