import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { getConversationForParticipant, getMessages } from "@/features/mentors/server/queries";
import { sendMessageToStudentContent, markConversationRead } from "@/features/mentors/actions/message-actions";
import { ConversationPanel } from "@/features/mentors/components/shared/conversation-panel";

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { conversationId } = await params;
  const user = await requireRole("MENTOR");
  const conversation = await getConversationForParticipant(conversationId, user.id);
  return { title: conversation?.student.name ?? "Messages" };
}

export default async function MentorConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const user = await requireRole("MENTOR");
  const conversation = await getConversationForParticipant(conversationId, user.id);
  if (!conversation) notFound();

  const messages = await getMessages(conversationId);
  void markConversationRead(conversationId);

  return (
    <>
      <SetPageTitle title={conversation.student.name ?? "Messages"} />
      <Container className="py-8">
        <ConversationPanel
          currentUserId={user.id}
          otherPartyName={conversation.student.name ?? "this student"}
          messages={messages}
          onSend={sendMessageToStudentContent.bind(null, conversation.studentId)}
        />
      </Container>
    </>
  );
}
