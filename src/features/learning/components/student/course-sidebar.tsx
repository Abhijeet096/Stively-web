import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
  BookOpen,
  ClipboardCheck,
  Sparkles,
  FileText,
  Presentation,
  Download,
  ExternalLink,
  Code2,
  Radio,
  FolderKanban,
} from "lucide-react";
import type { LessonBlockType, LessonProgress, LessonProgressStatus } from "@prisma/client";

import { cn } from "@/lib/utils";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { flattenLessons, isLessonUnlocked } from "../../lib/progress";
import type { CurriculumItem, ModuleWithLessons } from "../../server/queries";

/** One icon per learning-item type, so a learner can tell a video from a quiz at a glance without reading. Shared with the lesson's own item tabs so both surfaces stay identical. */
export const ITEM_ICON: Record<LessonBlockType, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  MARKDOWN: BookOpen,
  RICH_TEXT: BookOpen,
  QUIZ: ClipboardCheck,
  ASSIGNMENT: FolderKanban,
  PROJECT: FolderKanban,
  AI_CONVERSATION: Sparkles,
  PDF: FileText,
  SLIDES: Presentation,
  DOWNLOAD: Download,
  EXTERNAL_LINK: ExternalLink,
  EMBED: ExternalLink,
  CODE: Code2,
  LIVE_SESSION: Radio,
};

export interface CourseSidebarProps {
  enrollmentId: string;
  courseTitle: string;
  modules: ModuleWithLessons[];
  progressByLessonId: Map<string, LessonProgress>;
  itemsByLessonId: Map<string, CurriculumItem[]>;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  activeLessonId: string;
  activeItemId?: string;
}

/**
 * The persistent course navigation - the same tree on desktop (fixed rail)
 * and mobile (inside the drawer), so there is exactly one implementation of
 * lock/completion state to keep correct.
 *
 * A Server Component: Accordion handles its own client interactivity
 * internally, the same way curriculum-nav.tsx and faq-section.tsx already
 * rely on. Lock state is derived here purely for display - the lesson route
 * re-verifies it server-side, so a hand-typed URL still can't skip gating.
 */
function CourseSidebar({
  enrollmentId,
  courseTitle,
  modules,
  progressByLessonId,
  itemsByLessonId,
  progressPercentage,
  completedLessons,
  totalLessons,
  activeLessonId,
  activeItemId,
}: CourseSidebarProps) {
  const orderedLessons = flattenLessons(modules);
  const statusByLessonId = new Map<string, LessonProgressStatus>(
    orderedLessons.map((l) => [l.id, progressByLessonId.get(l.id)?.status ?? "NOT_STARTED"])
  );
  const activeModuleId = modules.find((m) => m.lessons.some((l) => l.id === activeLessonId))?.id;

  return (
    <div className="flex h-full flex-col">
      <div className="border-border/70 flex flex-col gap-3 border-b px-4 py-4">
        <p className="text-foreground font-display text-sm leading-snug font-semibold">{courseTitle}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Course progress</span>
            <span className="text-foreground font-semibold tabular-nums">{progressPercentage}%</span>
          </div>
          <div
            className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Course progress"
          >
            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
          </div>
          <span className="text-muted-foreground text-xs">
            {completedLessons} of {totalLessons} lesson{totalLessons === 1 ? "" : "s"} completed
          </span>
        </div>
      </div>

      <nav aria-label="Course content" className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <Accordion type="multiple" defaultValue={activeModuleId ? [activeModuleId] : []} className="w-full">
          {modules.map((module, moduleIndex) => (
            <AccordionItem key={module.id} value={module.id} className="border-b-0">
              <AccordionTrigger className="px-2 py-2.5 text-left hover:no-underline">
                <span className="flex flex-1 items-center justify-between gap-2 pr-2">
                  <span className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground font-mono text-[11px] tracking-widest uppercase">
                      Module {moduleIndex + 1}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        module.lessons.length === 0 ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {module.title}
                    </span>
                  </span>
                  {module.lessons.length === 0 && (
                    <span className="text-muted-foreground bg-muted shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">
                      Coming soon
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                <ul className="flex flex-col gap-0.5">
                  {module.lessons.length === 0 && (
                    <li className="text-muted-foreground/70 flex items-start gap-2.5 px-3 py-2 text-sm">
                      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span>Coming soon - added free once it&apos;s recorded.</span>
                    </li>
                  )}
                  {module.lessons.map((lesson) => {
                    const lessonIndex = orderedLessons.findIndex((l) => l.id === lesson.id);
                    const previousLesson = lessonIndex > 0 ? orderedLessons[lessonIndex - 1] : undefined;
                    const unlocked = isLessonUnlocked(
                      lesson,
                      previousLesson,
                      previousLesson ? statusByLessonId.get(previousLesson.id) : undefined
                    );
                    const lessonStatus = statusByLessonId.get(lesson.id) ?? "NOT_STARTED";
                    const items = itemsByLessonId.get(lesson.id) ?? [];

                    return (
                      <li key={lesson.id} className="flex flex-col">
                        {/* The lesson itself is a heading when it has items - the items are what's navigable. */}
                        {items.length > 0 && module.lessons.length > 1 && (
                          <span className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-medium">
                            {lesson.title}
                          </span>
                        )}

                        {items.length === 0 ? (
                          <ItemRow
                            href={`/student/learning/${enrollmentId}/${lesson.id}`}
                            label={lesson.title}
                            Icon={PlayCircle}
                            unlocked={unlocked}
                            completed={lessonStatus === "COMPLETED"}
                            inProgress={lessonStatus === "IN_PROGRESS"}
                            active={lesson.id === activeLessonId}
                          />
                        ) : (
                          items.map((item) => (
                            <ItemRow
                              key={item.id}
                              href={`/student/learning/${enrollmentId}/${lesson.id}?item=${item.id}`}
                              label={item.title}
                              Icon={ITEM_ICON[item.type] ?? Circle}
                              unlocked={unlocked}
                              // A quiz reports its own real result; everything else follows the lesson.
                              completed={item.quizPassed ?? lessonStatus === "COMPLETED"}
                              inProgress={lessonStatus === "IN_PROGRESS"}
                              active={lesson.id === activeLessonId && item.id === activeItemId}
                            />
                          ))
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
    </div>
  );
}

function ItemRow({
  href,
  label,
  Icon,
  unlocked,
  completed,
  inProgress,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof PlayCircle;
  unlocked: boolean;
  completed: boolean;
  inProgress: boolean;
  active: boolean;
}) {
  const StatusIcon = !unlocked ? Lock : completed ? CheckCircle2 : Icon;

  const body = (
    <span
      className={cn(
        "flex items-start gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
        active
          ? "bg-primary/10 text-primary font-medium"
          : unlocked
            ? "text-foreground hover:bg-accent"
            : "text-muted-foreground/70 cursor-not-allowed"
      )}
    >
      <StatusIcon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          !unlocked
            ? "text-muted-foreground/60"
            : completed
              ? "text-success"
              : active
                ? "text-primary"
                : inProgress
                  ? "text-primary/70"
                  : "text-muted-foreground"
        )}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      {active && <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true" />}
    </span>
  );

  if (!unlocked) {
    return (
      <span aria-disabled="true" title="Complete the previous lesson and its quiz to unlock this.">
        {body}
      </span>
    );
  }

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className="block">
      {body}
    </Link>
  );
}

export { CourseSidebar };
