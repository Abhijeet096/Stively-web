import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { getMentorByUserId, getMyAssignedStudents, getOrCreateConversation, getMessages } from "@/features/mentors/server/queries";
import { sendMessageToStudentContent } from "@/features/mentors/actions/message-actions";
import { StudentDetailPanel } from "@/features/mentors/components/mentor/student-detail-panel";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { studentId } = await params;
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  const assignment = mentor ? (await getMyAssignedStudents(mentor.id)).find((a) => a.studentId === studentId) : null;
  return { title: assignment?.student.name ?? "Student" };
}

export default async function MentorStudentDetailPage({ params }: PageProps) {
  const { studentId } = await params;
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  if (!mentor) notFound();

  const assignments = await getMyAssignedStudents(mentor.id);
  const assignment = assignments.find((a) => a.studentId === studentId);
  if (!assignment) notFound();

  const conversation = await getOrCreateConversation(mentor.id, studentId);
  const messages = await getMessages(conversation.id);

  return (
    <>
      <SetPageTitle title={assignment.student.name ?? "Student"} />
      <Container className="py-8">
        <StudentDetailPanel
          assignment={assignment}
          messages={messages}
          currentUserId={user.id}
          onSend={sendMessageToStudentContent.bind(null, studentId)}
        />
      </Container>
    </>
  );
}
