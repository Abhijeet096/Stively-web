"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SendHorizonal } from "lucide-react";

import type { MentorMessage } from "@prisma/client";
import type { ActionResult } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ConversationPanelProps {
  currentUserId: string;
  otherPartyName: string;
  messages: MentorMessage[];
  /** Pre-bound to whichever side is sending (sendMessageToMentor/sendMessageToStudent) - the panel itself never needs to know mentorId/studentId. */
  onSend: (content: string) => Promise<ActionResult>;
}

/**
 * Role-agnostic message thread - both the mentor and student portals render
 * this same component with a different `onSend` binding, per the "one
 * running thread, one composer UI" design (see MentorConversation's schema
 * comment).
 */
function ConversationPanel({ currentUserId, otherPartyName, messages, onSend }: ConversationPanelProps) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setIsPending(true);
    setError(undefined);
    const result = await onSend(trimmed);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <div className="border-border flex h-[32rem] flex-col rounded-xl border">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No messages yet. Say hello to {otherPartyName}.
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                    isMine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  <p className="text-pretty whitespace-pre-line">{message.content}</p>
                  <span
                    className={cn(
                      "mt-1 block text-[11px]",
                      isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {new Date(message.createdAt).toLocaleString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-border flex flex-col gap-2 border-t p-3">
        {error && <p className="text-destructive text-xs">{error}</p>}
        <div className="flex items-end gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={`Message ${otherPartyName}...`}
            className="min-h-10 resize-none"
            rows={1}
          />
          <Button size="icon" onClick={handleSend} loading={isPending} aria-label="Send message">
            <SendHorizonal className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ConversationPanel };
