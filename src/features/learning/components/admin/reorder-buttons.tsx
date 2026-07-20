"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Arrow-button reordering, reused for Module/Lesson/LessonBlock rows - simpler and more accessible than a drag-and-drop library, and zero new dependencies. */
function ReorderButtons({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
}: {
  onMoveUp: () => Promise<unknown>;
  onMoveDown: () => Promise<unknown>;
  disableUp?: boolean;
  disableDown?: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function run(action: () => Promise<unknown>) {
    setIsPending(true);
    await action();
    setIsPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        disabled={disableUp || isPending}
        onClick={() => run(onMoveUp)}
        aria-label="Move up"
      >
        <ChevronUp className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        disabled={disableDown || isPending}
        onClick={() => run(onMoveDown)}
        aria-label="Move down"
      >
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}

export { ReorderButtons };
