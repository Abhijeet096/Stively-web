"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendAiTutorMessage } from "../../actions/ai-tutor-actions";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

export interface AiTutorChatProps {
  enrollmentId: string;
  lessonId: string;
  initialMessages: { id: string; role: "USER" | "ASSISTANT"; content: string }[];
  initialRemainingToday: number;
  dailyLimit: number;
}

/** The interactive half of the AI Tutor block - BlockAiConversation loads the initial state server-side, this just handles sending new messages and appending the exchange once a real reply comes back. */
function AiTutorChat({ enrollmentId, lessonId, initialMessages, initialRemainingToday, dailyLimit }: AiTutorChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [question, setQuestion] = React.useState("");
  const [remaining, setRemaining] = React.useState(initialRemainingToday);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isPending || remaining <= 0) return;

    setIsPending(true);
    setError(undefined);
    // Optimistic user bubble - the assistant reply is appended once the real response arrives, never fabricated client-side.
    const optimisticId = `pending-${Date.now()}`;
    setMessages((prev) => [...prev, { id: optimisticId, role: "USER", content: trimmed }]);
    setQuestion("");

    const result = await sendAiTutorMessage({ enrollmentId, lessonId, question: trimmed });
    setIsPending(false);

    if (!result.success) {
      setError(result.error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setQuestion(trimmed);
      return;
    }

    setMessages((prev) => [...prev, { id: `${optimisticId}-reply`, role: "ASSISTANT", content: result.reply ?? "" }]);
    if (typeof result.remainingToday === "number") setRemaining(result.remainingToday);
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={listRef} className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-sm">No questions yet - ask anything about this lesson to get started.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-line " +
              (m.role === "USER" ? "bg-primary text-primary-foreground self-end" : "bg-muted text-foreground self-start")
            }
          >
            {m.content}
          </div>
        ))}
        {isPending && <div className="bg-muted text-muted-foreground self-start rounded-lg px-3 py-2 text-sm">Thinking…</div>}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this lesson..."
          rows={2}
          maxLength={500}
          disabled={remaining <= 0}
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">
            {remaining > 0 ? `${remaining} of ${dailyLimit} questions left today` : "Daily limit reached - try again tomorrow"}
          </span>
          <Button type="submit" size="sm" loading={isPending} disabled={!question.trim() || remaining <= 0}>
            Ask
          </Button>
        </div>
      </form>
    </div>
  );
}

export { AiTutorChat };
