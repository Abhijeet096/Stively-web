import { videoContentSchema } from "../../lib/block-types";
import type { LessonBlock } from "@prisma/client";

/** YouTube/Vimeo embed via iframe for those providers; a native <video> element for a direct file URL. No player chrome customization or resume-position wiring here yet - lastPositionSeconds exists on LessonProgress for a future enhancement. */
function BlockVideo({ block }: { block: LessonBlock }) {
  const parsed = videoContentSchema.safeParse(block.content);
  if (!parsed.success) return null;
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
