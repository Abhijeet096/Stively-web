import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Lesson } from "@prisma/client";

function LessonPager({
  enrollmentId,
  previousLesson,
  nextLesson,
  nextUnlocked,
}: {
  enrollmentId: string;
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  nextUnlocked: boolean;
}) {
  return (
    <nav aria-label="Lesson navigation" className="flex items-center justify-between gap-3">
      <Button variant="outline" disabled={!previousLesson} asChild={!!previousLesson}>
        {previousLesson ? (
          <Link href={`/student/learning/${enrollmentId}/${previousLesson.id}`}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </Link>
        ) : (
          <span>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </span>
        )}
      </Button>

      <Button disabled={!nextLesson || !nextUnlocked} asChild={!!nextLesson && nextUnlocked}>
        {nextLesson && nextUnlocked ? (
          <Link href={`/student/learning/${enrollmentId}/${nextLesson.id}`}>
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <span>
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </span>
        )}
      </Button>
    </nav>
  );
}

export { LessonPager };
