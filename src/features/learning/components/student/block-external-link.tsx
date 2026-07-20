import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { externalLinkContentSchema } from "../../lib/block-types";
import type { LessonBlock } from "@prisma/client";

function BlockExternalLink({ block }: { block: LessonBlock }) {
  const parsed = externalLinkContentSchema.safeParse(block.content);
  if (!parsed.success) return null;
  const content = parsed.data;

  return (
    <Link href={content.url} target="_blank" rel="noopener noreferrer" className="block">
      <Card variant="interactive">
        <CardContent className="flex items-center gap-3">
          <ExternalLink className="text-primary size-5 shrink-0" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-medium">{block.title ?? content.url}</span>
            {content.description && <span className="text-muted-foreground text-sm">{content.description}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export { BlockExternalLink };
