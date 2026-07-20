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
}: {
  enrollmentId: string;
  lessonId: string;
  isCompleted: boolean;
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
