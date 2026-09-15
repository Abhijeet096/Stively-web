import { PlayCircle } from "lucide-react";

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
function BlockVideo({ block }: { block: LessonBlock }) {
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
    <div className="bg-ink aspect-video w-full overflow-hidden rounded-xl">
      {embedSrc ? (
        <iframe
          src={embedSrc}
          title={block.title ?? "Lesson video"}
          className="size-full"
          allow="accelerate-compute; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={content.url} controls className="size-full" />
      )}
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
