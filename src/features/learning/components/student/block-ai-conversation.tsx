import { Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getAiTutorConversation } from "../../server/queries";
import { AiTutorChat } from "./ai-tutor-chat";

/** AI_CONVERSATION blocks all render through this - async Server Component so the existing conversation (if any) and today's remaining quota load without a client-side fetch, same pattern as BlockAssessment. */
async function BlockAiConversation({ enrollmentId, lessonId }: { enrollmentId: string; lessonId: string }) {
  const session = await auth();
  const state = session?.user?.id ? await getAiTutorConversation(enrollmentId, lessonId, session.user.id) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary size-4" aria-hidden="true" />
          AI Tutor
        </CardTitle>
        <CardDescription>Ask about this lesson - the tutor only answers questions grounded in what&apos;s covered here.</CardDescription>
      </CardHeader>
      <CardContent>
        {state ? (
          <AiTutorChat
            enrollmentId={enrollmentId}
            lessonId={lessonId}
            initialMessages={state.messages}
            initialRemainingToday={state.remainingToday}
            dailyLimit={state.dailyLimit}
          />
        ) : (
          <p className="text-muted-foreground text-sm">The tutor isn&apos;t available right now.</p>
        )}
      </CardContent>
    </Card>
  );
}

export { BlockAiConversation };
