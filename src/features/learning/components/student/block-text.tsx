import Link from "next/link";
import Markdown from "react-markdown";
import { Download, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { richTextContentSchema } from "../../lib/block-types";
import { ReadingAutoComplete } from "./reading-auto-complete";
import type { LessonBlock } from "@prisma/client";

/** Shown under a reading-material block regardless of MARKDOWN/RICH_TEXT - the PDF route itself only serves those two types, matching block-renderer.tsx's dispatch. */
function ReadingDownload({ enrollmentId, blockId, canDownload }: { enrollmentId: string; blockId: string; canDownload: boolean }) {
  return canDownload ? (
    <Button asChild variant="outline" size="sm" className="w-fit">
      <a href={`/api/learning/${enrollmentId}/blocks/${blockId}/pdf`}>
        <Download aria-hidden="true" />
        Download as PDF
      </a>
    </Button>
  ) : (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Lock className="size-3.5" aria-hidden="true" />
      Downloading reading material is a{" "}
      <Link href="/checkout/prime-membership" className="text-primary underline underline-offset-4">
        Prime Membership
      </Link>{" "}
      perk.
    </p>
  );
}

/** RICH_TEXT and MARKDOWN share this renderer (and the same {text} content shape) - RICH_TEXT preserves line breaks as plain paragraphs (no HTML sanitizer in this codebase, so no dangerouslySetInnerHTML), MARKDOWN renders through react-markdown (safe by default, no raw HTML passthrough). */
function BlockText({
  block,
  enrollmentId,
  canDownload,
  lessonAlreadyCompleted,
}: {
  block: LessonBlock;
  enrollmentId: string;
  /** access-policy.ts's canDownloadResources (Prime Membership) - gates the download button below, not the on-page reading itself, which stays open to every enrolled student either way. */
  canDownload: boolean;
  lessonAlreadyCompleted: boolean;
}) {
  const parsed = richTextContentSchema.safeParse(block.content);
  if (!parsed.success) return null;
  const content = parsed.data;

  if (block.type === "MARKDOWN") {
    // No @tailwindcss/typography plugin in this project - styled directly
    // via descendant selectors instead of pulling in a second new
    // dependency just for prose defaults.
    return (
      <div className="flex flex-col gap-4">
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
        <ReadingDownload enrollmentId={enrollmentId} blockId={block.id} canDownload={canDownload} />
        <ReadingAutoComplete enrollmentId={enrollmentId} lessonId={block.lessonId} lessonAlreadyCompleted={lessonAlreadyCompleted} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-foreground text-base whitespace-pre-line text-pretty">{content.text}</p>
      <ReadingDownload enrollmentId={enrollmentId} blockId={block.id} canDownload={canDownload} />
      <ReadingAutoComplete enrollmentId={enrollmentId} lessonId={block.lessonId} lessonAlreadyCompleted={lessonAlreadyCompleted} />
    </div>
  );
}

export { BlockText };
