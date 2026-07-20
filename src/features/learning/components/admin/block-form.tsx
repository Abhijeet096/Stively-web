"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { LessonBlockType, ResourceType, AssessmentType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { BLOCK_TYPE_LABEL, BLOCK_STORAGE_KIND } from "../../lib/block-types";
import {
  createBlock,
  updateBlock,
  createResource,
  createAssessment,
  createLiveSession,
  type BlockInput,
} from "../../actions/admin-curriculum-actions";
import type { LessonBlockWithRelations } from "../../server/queries";
import type { Resource, Assessment, LiveSession } from "@prisma/client";

const BLOCK_TYPES = Object.values(LessonBlockType);

export interface BlockFormProps {
  lessonId: string;
  learningExperienceId: string;
  block?: LessonBlockWithRelations;
  resources: Resource[];
  assessments: Assessment[];
  liveSessions: LiveSession[];
}

/**
 * The reusable, type-switching block editor - one component whose fields
 * change based on the selected LessonBlockType, rather than fourteen
 * bespoke forms. This is the concrete "reusable editor pattern" the brief
 * asks for.
 */
function BlockForm({ lessonId, learningExperienceId, block: existing, resources, assessments, liveSessions }: BlockFormProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<LessonBlockType>(existing?.type ?? "RICH_TEXT");
  const [title, setTitle] = React.useState(existing?.title ?? "");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  // "content" kind fields
  const existingContent = (existing?.content as Record<string, string> | null) ?? {};
  const [text, setText] = React.useState(existingContent.text ?? "");
  const [url, setUrl] = React.useState(existingContent.url ?? "");
  const [description, setDescription] = React.useState(existingContent.description ?? "");
  const [language, setLanguage] = React.useState(existingContent.language ?? "");
  const [snippet, setSnippet] = React.useState(existingContent.snippet ?? "");
  const [systemPrompt, setSystemPrompt] = React.useState(existingContent.systemPrompt ?? "");

  // "resource"/"assessment"/"liveSession" kind: pick existing, or create new inline
  const [pickedId, setPickedId] = React.useState<string | undefined>(
    existing?.resourceId ?? existing?.assessmentId ?? existing?.liveSessionId ?? undefined
  );
  const [creatingNew, setCreatingNew] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newUrl, setNewUrl] = React.useState("");
  const [newAssessmentType, setNewAssessmentType] = React.useState<AssessmentType>("QUIZ");
  const [newScheduledAt, setNewScheduledAt] = React.useState("");

  const storageKind = BLOCK_STORAGE_KIND[type];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);

    let payload: Record<string, unknown> = {};

    if (storageKind === "content") {
      payload =
        type === "RICH_TEXT" || type === "MARKDOWN"
          ? { text }
          : type === "VIDEO"
            ? { url }
            : type === "EXTERNAL_LINK"
              ? { url, description: description || undefined }
              : type === "EMBED"
                ? { url }
                : type === "CODE"
                  ? { language, snippet }
                  : { systemPrompt: systemPrompt || undefined };
    } else if (storageKind === "resource") {
      let resourceId = pickedId;
      if (creatingNew) {
        const created = await createResource({ title: newTitle, type: "LINK" as ResourceType, url: newUrl });
        if (!created.success || !created.id) {
          setIsPending(false);
          setError(created.success ? "Something went wrong." : created.error);
          return;
        }
        resourceId = created.id;
      }
      if (!resourceId) {
        setIsPending(false);
        setError("Choose or create a resource.");
        return;
      }
      payload = { resourceId };
    } else if (storageKind === "assessment") {
      let assessmentId = pickedId;
      if (creatingNew) {
        const created = await createAssessment({ title: newTitle, type: newAssessmentType });
        if (!created.success || !created.id) {
          setIsPending(false);
          setError(created.success ? "Something went wrong." : created.error);
          return;
        }
        assessmentId = created.id;
      }
      if (!assessmentId) {
        setIsPending(false);
        setError("Choose or create an assessment.");
        return;
      }
      payload = { assessmentId };
    } else {
      let liveSessionId = pickedId;
      if (creatingNew) {
        const created = await createLiveSession(learningExperienceId, { title: newTitle, scheduledAt: newScheduledAt });
        if (!created.success || !created.id) {
          setIsPending(false);
          setError(created.success ? "Something went wrong." : created.error);
          return;
        }
        liveSessionId = created.id;
      }
      if (!liveSessionId) {
        setIsPending(false);
        setError("Choose or create a live session.");
        return;
      }
      payload = { liveSessionId };
    }

    const input: BlockInput = { type, title: title || undefined, payload };
    const result = existing ? await updateBlock(existing.id, input) : await createBlock(lessonId, input);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existing ? (
          <Button variant="ghost" size="icon" aria-label="Edit block">
            <Pencil className="size-3.5" aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Add content
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit content block" : "New content block"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as LessonBlockType)}>
              <SelectTrigger id="block-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {BLOCK_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block-title">Title (optional)</Label>
            <Input id="block-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          {storageKind === "content" && (type === "RICH_TEXT" || type === "MARKDOWN") && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="block-text">{type === "MARKDOWN" ? "Markdown" : "Text"}</Label>
              <Textarea id="block-text" value={text} onChange={(event) => setText(event.target.value)} rows={6} required />
            </div>
          )}

          {storageKind === "content" && (type === "VIDEO" || type === "EMBED" || type === "EXTERNAL_LINK") && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="block-url">URL</Label>
              <Input id="block-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} required />
            </div>
          )}
          {storageKind === "content" && type === "EXTERNAL_LINK" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="block-link-description">Description (optional)</Label>
              <Input id="block-link-description" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
          )}

          {storageKind === "content" && type === "CODE" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="block-language">Language</Label>
                <Input id="block-language" value={language} onChange={(event) => setLanguage(event.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="block-snippet">Code</Label>
                <Textarea id="block-snippet" value={snippet} onChange={(event) => setSnippet(event.target.value)} rows={6} required className="font-mono text-sm" />
              </div>
            </>
          )}

          {storageKind === "content" && type === "AI_CONVERSATION" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="block-system-prompt">System prompt (optional - for the future AI tutor)</Label>
              <Textarea id="block-system-prompt" value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} rows={3} />
            </div>
          )}

          {(storageKind === "resource" || storageKind === "assessment" || storageKind === "liveSession") && (
            <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
              {!creatingNew ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="block-existing">
                      {storageKind === "resource" ? "Resource" : storageKind === "assessment" ? "Assessment" : "Live session"}
                    </Label>
                    <Select value={pickedId} onValueChange={setPickedId}>
                      <SelectTrigger id="block-existing">
                        <SelectValue placeholder="Choose existing..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(storageKind === "resource" ? resources : storageKind === "assessment" ? assessments : liveSessions).map(
                          (item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.title}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setCreatingNew(true)}>
                    + Create new instead
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="block-new-title">Title</Label>
                    <Input id="block-new-title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} required />
                  </div>
                  {storageKind === "resource" && (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="block-new-url">URL</Label>
                      <Input id="block-new-url" type="url" value={newUrl} onChange={(event) => setNewUrl(event.target.value)} required />
                    </div>
                  )}
                  {storageKind === "assessment" && (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="block-new-assessment-type">Assessment type</Label>
                      <Select value={newAssessmentType} onValueChange={(value) => setNewAssessmentType(value as AssessmentType)}>
                        <SelectTrigger id="block-new-assessment-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(AssessmentType).map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {storageKind === "liveSession" && (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="block-new-scheduled">Date &amp; time</Label>
                      <Input
                        id="block-new-scheduled"
                        type="datetime-local"
                        value={newScheduledAt}
                        onChange={(event) => setNewScheduledAt(event.target.value)}
                        required
                      />
                    </div>
                  )}
                  <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setCreatingNew(false)}>
                    Choose existing instead
                  </Button>
                </>
              )}
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={isPending}>
              {existing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { BlockForm };
