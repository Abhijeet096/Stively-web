import Link from "next/link";
import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { flattenLessons, isLessonUnlocked } from "../../lib/progress";
import type { ModuleWithLessons } from "../../server/queries";
import type { LessonProgress, LessonProgressStatus } from "@prisma/client";

export interface CurriculumNavProps {
  enrollmentId: string;
  modules: ModuleWithLessons[];
  progressByLessonId: Map<string, LessonProgress>;
  activeLessonId?: string;
  defaultOpenModuleId?: string;
}

/** The curriculum tree - an Accordion of modules, each listing its lessons with a status icon (complete/in-progress/locked/not-started). Server Component: Accordion (src/components/ui/accordion.tsx) already handles its own client interactivity internally, same pattern faq-section.tsx already relies on. */
function CurriculumNav({ enrollmentId, modules, progressByLessonId, activeLessonId, defaultOpenModuleId }: CurriculumNavProps) {
  const orderedLessons = flattenLessons(modules);
  const statusByLessonId = new Map<string, LessonProgressStatus>(
    orderedLessons.map((l) => [l.id, progressByLessonId.get(l.id)?.status ?? "NOT_STARTED"])
  );

  return (
    <nav aria-label="Curriculum">
      <Accordion type="single" collapsible defaultValue={defaultOpenModuleId} className="w-full">
        {modules.map((module) => (
          <AccordionItem key={module.id} value={module.id}>
            <AccordionTrigger>{module.title}</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-1">
                {module.lessons.map((lesson, index) => {
                  const lessonIndex = orderedLessons.findIndex((l) => l.id === lesson.id);
                  const previousLesson = lessonIndex > 0 ? orderedLessons[lessonIndex - 1] : undefined;
                  const unlocked = isLessonUnlocked(
                    lesson,
                    previousLesson,
                    previousLesson ? statusByLessonId.get(previousLesson.id) : undefined
                  );
                  const status = statusByLessonId.get(lesson.id) ?? "NOT_STARTED";
                  const isActive = lesson.id === activeLessonId;

                  const Icon = !unlocked ? Lock : status === "COMPLETED" ? CheckCircle2 : status === "IN_PROGRESS" ? PlayCircle : Circle;

                  const content = (
                    <span
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : unlocked
                            ? "text-foreground hover:bg-accent"
                            : "text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          status === "COMPLETED" ? "text-success" : "text-muted-foreground"
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {index + 1}. {lesson.title}
                      </span>
                    </span>
                  );

                  return (
                    <li key={lesson.id}>
                      {unlocked ? (
                        <Link
                          href={`/student/learning/${enrollmentId}/${lesson.id}`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {content}
                        </Link>
                      ) : (
                        <span aria-disabled="true">{content}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </nav>
  );
}

export { CurriculumNav };
