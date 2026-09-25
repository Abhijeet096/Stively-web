"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Lock, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { markLessonComplete } from "../../actions/progress-actions";
import { videoContentSchema } from "../../lib/block-types";
import type { LessonBlock } from "@prisma/client";

/**
 * YouTube/Vimeo embed via iframe for those providers; a native <video>
 * element for a direct file URL. No player chrome customization or
 * resume-position wiring here yet - lastPositionSeconds exists on
 * LessonProgress for a future enhancement.
 *
 * A VIDEO block with no url yet (reading material and the quiz already
 * written from the real script, recording just hasn't happened) is a real,
 * expected state during content rollout - not an error to hide. Shows an
 * honest "coming soon" panel in the same aspect-video frame rather than
 * silently rendering nothing, which used to look like a broken page. Not
 * EmptyState's usual py-16 - this has to fit inside a 16:9 box down to
 * mobile width, where that much vertical padding would clip.
 */
function BlockVideo({
  block,
  enrollmentId,
  canDownload,
  lessonAlreadyCompleted,
}: {
  block: LessonBlock;
  enrollmentId: string;
  canDownload: boolean;
  /** Skips the auto-complete watcher below once already true - markLessonComplete is idempotent either way, this just avoids a pointless upsert+revalidate on every revisit. */
  lessonAlreadyCompleted: boolean;
}) {
  // Fires once the direct-file player crosses 90% of its duration -
  // scrubbing straight there counts the same as watching linearly
  // (currentTime/duration is a pure position check, not a "watched every
  // second" one). markLessonComplete re-checks the quiz gate server-side
  // regardless, so this can never complete a lesson that still needs a
  // passed quiz - it only ever removes the manual click for lessons that
  // had nothing else blocking them. YouTube/Vimeo embeds below don't get
  // this: their playback happens inside the provider's own iframe, which
  // doesn't expose timeupdate events to this page without loading their
  // separate Player JS SDK - a real gap, not silently ignored, just out of
  // scope for the direct-file case this was asked for.
  //
  // The ref only latches on a CONFIRMED success, not on every attempt - a
  // lesson with an unpassed quiz will reject this call (correctly), and if
  // the ref latched anyway, watching to the very end would permanently
  // stop retrying even after the quiz gets passed later. The actual retry
  // for that ordering (quiz passed after the video already ended) lives in
  // assessment-submission-form.tsx, which attempts completion again right
  // after a quiz submission - this ref just avoids hammering the action on
  // every timeupdate tick in between.
  const hasAutoCompletedRef = React.useRef(lessonAlreadyCompleted);
  const isAttemptingRef = React.useRef(false);
  function attemptAutoComplete() {
    if (hasAutoCompletedRef.current || isAttemptingRef.current) return;
    isAttemptingRef.current = true;
    markLessonComplete(enrollmentId, block.lessonId)
      .then((result) => {
        if (result.success) hasAutoCompletedRef.current = true;
      })
      .finally(() => {
        isAttemptingRef.current = false;
      });
  }
  function handleTimeUpdate(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    if (!video.duration || video.currentTime / video.duration < 0.9) return;
    attemptAutoComplete();
  }

  const parsed = videoContentSchema.safeParse(block.content);
  if (!parsed.success) {
    return (
      <div className="bg-muted flex aspect-video w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-xl px-6 text-center">
        <span className="bg-background flex size-10 items-center justify-center rounded-full">
          <PlayCircle className="text-muted-foreground size-5" aria-hidden="true" />
        </span>
        <span className="text-foreground text-sm font-semibold">Video coming soon</span>
        <span className="text-muted-foreground max-w-xs text-xs text-balance">
          Being recorded now - the reading notes and quiz below are ready.
        </span>
      </div>
    );
  }
  const content = parsed.data;

  const embedSrc = toEmbedUrl(content.url, content.provider);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-ink aspect-video w-full overflow-hidden rounded-xl">
        {embedSrc ? (
          <iframe
            src={embedSrc}
            title={block.title ?? "Lesson video"}
            className="size-full"
            allow="accelerate-compute; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            // A YouTube/Vimeo embed has no file of ours to offer - the
            // provider's own player is the only playback surface, so
            // there's genuinely nothing below to gate or download.
          />
        ) : (
          <video
            src={content.url}
            controls
            className="size-full"
            controlsList={canDownload ? undefined : "nodownload"}
            onTimeUpdate={handleTimeUpdate}
            onEnded={attemptAutoComplete}
          />
        )}
      </div>

      {/* Only for a direct file (the <video> branch above) - an embed has
        no file of ours to hand over. `controlsList="nodownload"` above
        only hides the browser's own one-click icon for non-Prime viewers;
        this is the actual, honest download path, gated the same way. */}
      {!embedSrc &&
        (canDownload ? (
          <Button asChild variant="outline" size="sm" className="w-fit">
            <a href={content.url} download>
              <Download aria-hidden="true" />
              Download video
            </a>
          </Button>
        ) : (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Lock className="size-3.5" aria-hidden="true" />
            Downloading lectures is a{" "}
            <Link href="/checkout/prime-membership" className="text-primary underline underline-offset-4">
              Prime Membership
            </Link>{" "}
            perk.
          </p>
        ))}
    </div>
  );
}

function toEmbedUrl(url: string, provider?: string): string | null {
  if (provider === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
    const idMatch = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
    return idMatch ? `https://www.youtube.com/embed/${idMatch[1]}` : null;
  }
  if (provider === "vimeo" || url.includes("vimeo.com")) {
    const idMatch = url.match(/vimeo\.com\/(\d+)/);
    return idMatch ? `https://player.vimeo.com/video/${idMatch[1]}` : null;
  }
  return null;
}

export { BlockVideo };
