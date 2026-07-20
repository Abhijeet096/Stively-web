import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/sections/empty-state";
import { MentorAvatar } from "@/features/mentors/components/shared/mentor-avatar";
import { getMentorByUserId, getConversationsForMentor } from "@/features/mentors/server/queries";

export const metadata: Metadata = { title: "Messages" };

export default async function MentorMessagesPage() {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  const conversations = mentor ? await getConversationsForMentor(mentor.id) : [];

  return (
    <>
      <SetPageTitle title="Messages" />
      <Container className="flex flex-col gap-6 py-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Messages</h2>

        {conversations.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No conversations yet" description="Messages from your students will show up here." />
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map((conversation) => (
              <Link key={conversation.id} href={`/mentor/messages/${conversation.id}`}>
                <Card variant="interactive">
                  <CardContent className="flex items-center gap-3">
                    <MentorAvatar name={conversation.student.name} />
                    <div className="flex flex-col">
                      <span className="text-foreground text-sm font-medium">{conversation.student.name}</span>
                      <span className="text-muted-foreground text-xs">{conversation.student.email}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
