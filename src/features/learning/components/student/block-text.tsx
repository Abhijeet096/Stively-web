import Markdown from "react-markdown";

import { richTextContentSchema } from "../../lib/block-types";
import type { LessonBlock } from "@prisma/client";

/** RICH_TEXT and MARKDOWN share this renderer (and the same {text} content shape) - RICH_TEXT preserves line breaks as plain paragraphs (no HTML sanitizer in this codebase, so no dangerouslySetInnerHTML), MARKDOWN renders through react-markdown (safe by default, no raw HTML passthrough). */
function BlockText({ block }: { block: LessonBlock }) {
  const parsed = richTextContentSchema.safeParse(block.content);
  if (!parsed.success) return null;
  const content = parsed.data;

  if (block.type === "MARKDOWN") {
    // No @tailwindcss/typography plugin in this project - styled directly
    // via descendant selectors instead of pulling in a second new
    // dependency just for prose defaults.
    return (
      <div
        className={[
          "text-foreground flex flex-col gap-4 text-base",
          "[&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-semibold",
          "[&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold",
          "[&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold",
          "[&_p]:text-pretty [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1",
          "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm",
          "[&_pre]:bg-muted [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4",
        ].join(" ")}
      >
        <Markdown>{content.text}</Markdown>
      </div>
    );
  }

  return <p className="text-foreground text-base whitespace-pre-line text-pretty">{content.text}</p>;
}

export { BlockText };
