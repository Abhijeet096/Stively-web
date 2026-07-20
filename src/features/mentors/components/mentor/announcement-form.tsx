"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { createAnnouncement } from "../../actions/announcement-actions";

function AnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const result = await createAnnouncement({ title, content });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setTitle("");
    setContent("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField id="announcement-title" label="Title">
        <Input id="announcement-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cohort 3 kickoff" />
      </FormField>
      <FormField id="announcement-content" label="Message">
        <Textarea
          id="announcement-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Share an update with everyone you mentor..."
        />
      </FormField>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button onClick={handleSubmit} loading={isPending} disabled={!title.trim() || !content.trim()}>
        Post announcement
      </Button>
    </div>
  );
}

export { AnnouncementForm };
