"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { markLessonComplete } from "../../actions/progress-actions";

function LessonCompleteButton({
  enrollmentId,
  lessonId,
  isCompleted,
  blockedByUnpassedQuiz = false,
}: {
  enrollmentId: string;
  lessonId: string;
  isCompleted: boolean;
  /** True when this lesson has a QUIZ block that hasn't been passed yet - see isLessonBlockedByUnpassedQuiz. The button disables with an explanation rather than just disappearing, so it's clear why. */
  blockedByUnpassedQuiz?: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  if (isCompleted) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <CheckCircle2 className="text-success size-4" aria-hidden="true" />
        Completed
      </Button>
    );
  }

  if (blockedByUnpassedQuiz) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <Button disabled>Mark as complete</Button>
        <span className="text-muted-foreground text-xs">Pass the quiz above to unlock this.</span>
      </div>
    );
  }

  async function handleClick() {
    setIsPending(true);
    await markLessonComplete(enrollmentId, lessonId);
    setIsPending(false);
    router.refresh();
  }

  return (
    <Button onClick={handleClick} loading={isPending}>
      Mark as complete
    </Button>
  );
}

export { LessonCompleteButton };
