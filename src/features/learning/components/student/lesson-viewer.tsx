import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurriculumNav } from "./curriculum-nav";
import { BlockRenderer } from "./block-renderer";
import { LessonCompleteButton } from "./lesson-complete-button";
import { LessonPager } from "./lesson-pager";
import { isLessonUnlocked } from "../../lib/progress";
import type { Curriculum, LessonView } from "../../server/queries";

function LessonViewer({
  enrollmentId,
  curriculum,
  lessonView,
}: {
  enrollmentId: string;
  curriculum: Curriculum;
  lessonView: LessonView;
}) {
  const { lesson, blocks, progress, isUnlocked, previousLesson, nextLesson, moduleTitle } = lessonView;

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <CurriculumNav
          enrollmentId={enrollmentId}
          modules={curriculum.modules}
          progressByLessonId={curriculum.progressByLessonId}
          activeLessonId={lesson.id}
          defaultOpenModuleId={curriculum.modules.find((m) => m.lessons.some((l) => l.id === lesson.id))?.id}
        />
      </aside>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">{moduleTitle}</span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{lesson.title}</h1>
          {lesson.summary && <p className="text-muted-foreground text-sm">{lesson.summary}</p>}
          {progress?.status === "COMPLETED" && <Badge variant="success">Completed</Badge>}
        </div>

        {!isUnlocked ? (
          <Card>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Complete the previous lesson to unlock this one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-8">
            {blocks.map((block) => (
              <div key={block.id}>
                {block.title && <h2 className="text-foreground mb-3 text-lg font-semibold">{block.title}</h2>}
                <BlockRenderer block={block} enrollmentId={enrollmentId} />
              </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-6">
              <LessonCompleteButton
                enrollmentId={enrollmentId}
                lessonId={lesson.id}
                isCompleted={progress?.status === "COMPLETED"}
              />
            </div>

            <LessonPager
              enrollmentId={enrollmentId}
              previousLesson={previousLesson}
              nextLesson={nextLesson}
              nextUnlocked={!nextLesson || isLessonUnlocked(nextLesson, lesson, progress?.status ?? "NOT_STARTED")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export { LessonViewer };
