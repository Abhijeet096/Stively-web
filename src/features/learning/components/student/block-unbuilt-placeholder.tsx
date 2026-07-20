import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/sections/empty-state";
import { BLOCK_TYPE_LABEL } from "../../lib/block-types";
import type { LessonBlockType } from "@prisma/client";

/** AI_CONVERSATION today, and the fallback for any block type that doesn't have a full interactive UI yet - honest, not a fake chat window. */
function BlockUnbuiltPlaceholder({ type }: { type: LessonBlockType }) {
  return (
    <EmptyState
      icon={Sparkles}
      title={`${BLOCK_TYPE_LABEL[type]} coming soon`}
      description="This part of the lesson isn't available yet - check back soon."
    />
  );
}

export { BlockUnbuiltPlaceholder };
