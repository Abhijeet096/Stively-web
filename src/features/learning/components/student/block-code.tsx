import { codeContentSchema } from "../../lib/block-types";
import type { LessonBlock } from "@prisma/client";

function BlockCode({ block }: { block: LessonBlock }) {
  const parsed = codeContentSchema.safeParse(block.content);
  if (!parsed.success) return null;
  const content = parsed.data;

  return (
    <div className="flex flex-col gap-1.5">
      {content.language && (
        <span className="text-muted-foreground font-mono text-xs uppercase">{content.language}</span>
      )}
      <pre className="bg-ink text-ink-foreground overflow-x-auto rounded-lg p-4 font-mono text-sm">
        <code>{content.snippet}</code>
      </pre>
    </div>
  );
}

export { BlockCode };
