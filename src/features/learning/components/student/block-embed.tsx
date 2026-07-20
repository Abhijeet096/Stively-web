import { embedContentSchema } from "../../lib/block-types";
import type { LessonBlock } from "@prisma/client";

/** Generic iframe embed - the escape hatch for any embeddable third-party content the other block types don't name specifically. */
function BlockEmbed({ block }: { block: LessonBlock }) {
  const parsed = embedContentSchema.safeParse(block.content);
  if (!parsed.success) return null;
  const content = parsed.data;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border">
      <iframe src={content.url} title={block.title ?? "Embedded content"} className="size-full" />
    </div>
  );
}

export { BlockEmbed };
