"use client";

import * as React from "react";
import { Sparkles, X, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askProposalQuestion } from "../../actions/client-proposal-actions";

export interface ChatExchange {
  id: string;
  question: string;
  answer: string;
}

/**
 * Floating "Ask AI" panel, answerable from anywhere on the proposal page -
 * grounded only in this proposal's own content (see server/proposal-chat-
 * engine.ts), never a general-purpose chatbot. Bottom-right so it never
 * collides with the site-wide WhatsApp button (bottom-left, see
 * components/shared/whatsapp-button.tsx).
 */
function ProposalAiChat({ token, initialExchanges }: { token: string; initialExchanges: ChatExchange[] }) {
  const [open, setOpen] = React.useState(false);
  const [exchanges, setExchanges] = React.useState<ChatExchange[]>(initialExchanges);
  const [question, setQuestion] = React.useState("");
  const [isAsking, setIsAsking] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [exchanges]);

  async function handleAsk() {
    const q = question.trim();
    if (!q) return;
    setIsAsking(true);
    setError(undefined);
    const result = await askProposalQuestion({ token, question: q });
    setIsAsking(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const answer = result.answer;
    if (!answer) {
      setError("Something went wrong. Please try again.");
      return;
    }
    setExchanges((prev) => [...prev, { id: `${Date.now()}`, question: q, answer }]);
    setQuestion("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close proposal chat" : "Ask a question about this proposal"}
        className="bg-primary text-primary-foreground shadow-glow hover:-translate-y-0.5 fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full transition-transform duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
      >
        {open ? <X className="size-6" aria-hidden="true" /> : <Sparkles className="size-6" aria-hidden="true" />}
      </button>

      {open && (
        <div className="border-border bg-background fixed right-5 bottom-24 z-40 flex max-h-[70vh] w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-3 rounded-xl border p-4 shadow-2xl sm:w-96">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary size-4" aria-hidden="true" />
            <span className="text-foreground text-sm font-semibold">Ask about this proposal</span>
          </div>

          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {exchanges.length === 0 && (
              <p className="text-muted-foreground text-xs">
                Ask anything about the pricing, timeline, or what&apos;s included - answered directly from this proposal.
              </p>
            )}
            {exchanges.map((ex) => (
              <div key={ex.id} className="flex flex-col gap-1.5">
                <p className="bg-muted text-foreground self-end rounded-lg px-3 py-1.5 text-sm">{ex.question}</p>
                <p className="bg-primary/5 text-foreground rounded-lg px-3 py-1.5 text-sm">{ex.answer}</p>
              </div>
            ))}
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Why do I need SEO?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
            />
            <Button size="icon" onClick={handleAsk} loading={isAsking} disabled={!question.trim()} aria-label="Send question">
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export { ProposalAiChat };
