"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { createLesson, updateLesson } from "../../actions/admin-curriculum-actions";
import type { Lesson } from "@prisma/client";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function LessonForm({ moduleId, lesson: existing }: { moduleId: string; lesson?: Lesson }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState(existing?.title ?? "");
  const [slug, setSlug] = React.useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(!!existing);
  const [summary, setSummary] = React.useState(existing?.summary ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState(existing?.estimatedMinutes?.toString() ?? "");
  const [isPreviewable, setIsPreviewable] = React.useState(existing?.isPreviewable ?? false);
  const [requiresPreviousCompletion, setRequiresPreviousCompletion] = React.useState(
    existing?.requiresPreviousCompletion ?? true
  );
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);
    const input = {
      title,
      slug,
      summary: summary || undefined,
      estimatedMinutes: estimatedMinutes || undefined,
      isPreviewable,
      requiresPreviousCompletion,
    };
    const result = existing ? await updateLesson(existing.id, input) : await createLesson(moduleId, input);
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
          <Button variant="ghost" size="icon" aria-label="Edit lesson">
            <Pencil className="size-3.5" aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Add lesson
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit lesson" : "New lesson"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lesson-title">Title</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lesson-slug">Slug</Label>
            <Input
              id="lesson-slug"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugTouched(true);
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lesson-summary">Summary (optional)</Label>
            <Textarea id="lesson-summary" value={summary} onChange={(event) => setSummary(event.target.value)} rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lesson-minutes">Estimated minutes (optional)</Label>
            <Input
              id="lesson-minutes"
              type="number"
              min={1}
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPreviewable}
              onChange={(event) => setIsPreviewable(event.target.checked)}
              className="accent-primary"
            />
            Previewable without enrollment
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requiresPreviousCompletion}
              onChange={(event) => setRequiresPreviousCompletion(event.target.checked)}
              className="accent-primary"
            />
            Requires previous lesson to be completed
          </label>

          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={isPending}>
              {existing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { LessonForm };
