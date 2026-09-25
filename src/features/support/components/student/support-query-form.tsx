"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitStudentQuery } from "../../actions/support-actions";

/**
 * No name/email/phone fields - the student is already signed in, so
 * there's nothing to collect beyond the message itself. submitStudentQuery
 * reads who's asking straight from the session.
 */
function SupportQueryForm() {
  const [message, setMessage] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);
    const result = await submitStudentQuery(message);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setMessage("");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle2 className="text-success size-8" aria-hidden="true" />
        <p className="text-foreground text-sm font-medium">Sent - we&apos;ll get back to you soon.</p>
        <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What's up? Describe your question or issue..."
        rows={4}
        required
      />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button type="submit" loading={isPending} className="self-start">
        Send message
      </Button>
    </form>
  );
}

export { SupportQueryForm };
