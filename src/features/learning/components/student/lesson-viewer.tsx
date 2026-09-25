import Link from "next/link";
import { ArrowLeft, ArrowRight, Award, Check, Lock, PartyPopper } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlockRenderer } from "./block-renderer";
import { LessonCompleteButton } from "./lesson-complete-button";
import { ITEM_ICON } from "./course-sidebar";
import { flattenLessons, isLessonUnlocked } from "../../lib/progress";
import type { Curriculum, LessonView, CurriculumItem } from "../../server/queries";

/** One entry in the course-wide, item-level reading order the pager walks. */
interface FlatItem {
  lessonId: string;
  itemId: string | null;
  lessonUnlocked: boolean;
}

/**
 * Builds the whole course as a single ordered list of learning items, so
 * Previous/Next can cross a lesson boundary the same way it moves between
 * a video and its reading. Lock state is evaluated per lesson using the
 * existing rule, so the pager can never offer a link into gated content.
 */
function buildReadingOrder(curriculum: Curriculum): FlatItem[] {
  const orderedLessons = flattenLessons(curriculum.modules);
  const statusByLessonId = new Map(
    orderedLessons.map((l) => [l.id, curriculum.progressByLessonId.get(l.id)?.status ?? "NOT_STARTED"] as const)
  );

  return orderedLessons.flatMap((lesson, index): FlatItem[] => {
    const previous = index > 0 ? orderedLessons[index - 1] : undefined;
    const lessonUnlocked = isLessonUnlocked(
      lesson,
      previous,
      previous ? statusByLessonId.get(previous.id) : undefined
    );
    const items = curriculum.itemsByLessonId.get(lesson.id) ?? [];
    if (items.length === 0) return [{ lessonId: lesson.id, itemId: null, lessonUnlocked }];
    return items.map((item) => ({ lessonId: lesson.id, itemId: item.id, lessonUnlocked }));
  });
}

function hrefFor(enrollmentId: string, entry: FlatItem): string {
  const base = `/student/learning/${enrollmentId}/${entry.lessonId}`;
  return entry.itemId ? `${base}?item=${entry.itemId}` : base;
}

/**
 * The course player's main column - shows exactly one learning item at a
 * time, under a header that keeps the lesson (not the item) as the stable
 * anchor. The item strip below the title is the primary way to move within
 * a lesson: the four parts of a lesson are visible and one tap apart
 * without opening the course sidebar, which is what stops this feeling
 * like a document with a menu bolted on.
 *
 * Completion belongs to the lesson (that's what LessonProgress tracks), so
 * "Mark as complete" appears once the learner is on the lesson's final
 * item rather than repeating on every one.
 */
function LessonViewer({
  enrollmentId,
  curriculum,
  lessonView,
  activeItemId,
  canViewCertificate = false,
  canDownloadResources = false,
}: {
  enrollmentId: string;
  curriculum: Curriculum;
  lessonView: LessonView;
  activeItemId?: string;
  /** Whether this enrollment has cleared access-policy.ts's canViewCertificates gate - same check CertificateCard uses, so the caught-up panel below only ever links to a certificate that's actually there to generate/view. */
  canViewCertificate?: boolean;
  /** access-policy.ts's canDownloadResources (Prime Membership) - threaded to BlockRenderer for the video/reading download buttons. */
  canDownloadResources?: boolean;
}) {
  const { lesson, blocks, progress, isUnlocked, moduleTitle, blockedByUnpassedQuiz } = lessonView;

  const items: CurriculumItem[] = curriculum.itemsByLessonId.get(lesson.id) ?? [];
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeItemId)
  );
  const activeItem: CurriculumItem | undefined = items[activeIndex];
  const activeBlock = activeItem ? blocks.find((b) => b.id === activeItem.id) : undefined;

  const moduleIndex = curriculum.modules.findIndex((m) => m.lessons.some((l) => l.id === lesson.id));
  const lessonCompleted = progress?.status === "COMPLETED";
  const isLastItemOfLesson = items.length === 0 || activeIndex === items.length - 1;

  const order = buildReadingOrder(curriculum);
  const position = order.findIndex(
    (entry) => entry.lessonId === lesson.id && entry.itemId === (activeItem?.id ?? null)
  );
  const previousEntry = position > 0 ? order[position - 1] : null;
  const nextEntry = position >= 0 && position < order.length - 1 ? order[position + 1] : null;
  const nextAvailable = !!nextEntry && (nextEntry.lessonId === lesson.id || nextEntry.lessonUnlocked);
  const nextIsNewLesson = !!nextEntry && nextEntry.lessonId !== lesson.id;

  // Real count, not a copy-written guess - modules with no lessons recorded
  // yet (see AD-026's public-page treatment of the same fact). Reused below
  // to decide whether "you've reached the end" needs the reassurance panel
  // at all - a course that's genuinely fully built shouldn't show it.
  const upcomingModuleCount = curriculum.modules.filter((m) => m.lessons.length === 0).length;
  const caughtUpWithMoreComing = !nextEntry && lessonCompleted && upcomingModuleCount > 0;

  if (!isUnlocked) {
    return (
      <div className="border-border/70 bg-muted/30 flex flex-col items-center gap-3 rounded-xl border p-12 text-center">
        <span className="bg-muted flex size-11 items-center justify-center rounded-full">
          <Lock className="text-muted-foreground size-5" aria-hidden="true" />
        </span>
        <p className="text-foreground font-medium">This lesson is locked</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Complete the previous lesson and pass its quiz to unlock this one.
        </p>
      </div>
    );
  }

  return (
    <article className="flex min-w-0 flex-col">
      {/* ── Lesson header ─────────────────────────────── */}
      <header className="flex flex-col gap-3">
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
          {moduleIndex >= 0 && (
            <span className="text-primary font-mono font-medium tracking-widest uppercase">
              Module {moduleIndex + 1}
            </span>
          )}
          <span aria-hidden="true" className="text-border">
            /
          </span>
          <span className="truncate">{moduleTitle}</span>
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-foreground text-2xl font-semibold tracking-[-0.02em] text-balance sm:text-3xl">
            {lesson.title}
          </h1>
          {lessonCompleted && (
            <Badge variant="success" className="gap-1">
              <Check className="size-3" aria-hidden="true" />
              Completed
            </Badge>
          )}
        </div>

        {lesson.summary && (
          <p className="text-muted-foreground max-w-2xl text-sm text-pretty sm:text-base">{lesson.summary}</p>
        )}
      </header>

      {/* ── Item strip - the lesson's parts, one tap apart ── */}
      {items.length > 1 && (
        <nav
          aria-label="Lesson parts"
          className="border-border/70 -mx-4 mt-6 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0"
        >
          <ul className="flex w-max min-w-full gap-1">
            {items.map((item, index) => {
              const Icon = ITEM_ICON[item.type];
              const isActive = index === activeIndex;
              const done = item.quizPassed ?? lessonCompleted;
              return (
                <li key={item.id}>
                  <Link
                    href={`/student/learning/${enrollmentId}/${lesson.id}?item=${item.id}`}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                      isActive
                        ? "border-primary text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground border-transparent"
                    )}
                  >
                    {done ? (
                      <Check className="text-success size-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                    )}
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* ── The selected learning item ─────────────────── */}
      <div className="min-w-0 py-8">
        {activeBlock ? (
          <BlockRenderer
            block={activeBlock}
            enrollmentId={enrollmentId}
            canDownload={canDownloadResources}
            lessonAlreadyCompleted={lessonCompleted}
          />
        ) : (
          <p className="text-muted-foreground text-sm">This lesson doesn&apos;t have any content yet.</p>
        )}
      </div>

      {/* ── Completion ────────────────────────────────── */}
      {isLastItemOfLesson && (
        <div className="border-border/70 flex flex-wrap items-center gap-3 border-t py-6">
          <LessonCompleteButton
            enrollmentId={enrollmentId}
            lessonId={lesson.id}
            isCompleted={lessonCompleted}
            blockedByUnpassedQuiz={blockedByUnpassedQuiz}
          />
        </div>
      )}

      {/* ── Caught up, more on the way ───────────────────
        The actual moment this exists for: a learner finishes the last
        recorded lesson while 4 more modules are still real but unbuilt
        (AD-026). The old fallback here was a bare "You've reached the end
        of the course" - true in the narrow sense that the pager has
        nowhere left to send them, but it reads exactly like the course
        stopped rather than like more is coming, which is the thing that
        actually worries a paying student. Real count (upcomingModuleCount),
        not an invented number - and this panel only renders while that
        count is actually > 0, so a genuinely fully-built course never
        shows it. The 24h framing is the founder's own standing operating
        commitment (new lessons ship within a day of a learner reaching
        this point), not a one-time countdown from today - it has to stay
        true every time a student hits this, not just once. */}
      {caughtUpWithMoreComing && (
        <div className="border-primary/20 bg-primary/5 mt-8 flex flex-col items-center gap-3 rounded-xl border p-8 text-center">
          <span className="bg-primary/10 flex size-11 items-center justify-center rounded-full">
            <PartyPopper className="text-primary size-5" aria-hidden="true" />
          </span>
          <p className="text-foreground font-medium">You&apos;re all caught up - nice work.</p>
          <p className="text-muted-foreground max-w-md text-sm text-pretty">
            You&apos;ve completed every lesson available right now. We&apos;re recording the
            remaining {upcomingModuleCount} module{upcomingModuleCount === 1 ? "" : "s"} and adding
            them within 24 hours of you reaching this point - you&apos;ll get an email the moment
            they&apos;re live. Until then, practice what you&apos;ve learned on real prompts, or
            revisit a lesson to go deeper.
          </p>
          {/* canViewCertificate mirrors CertificateCard's own gate (access-policy.ts) -
            completing every currently-built lesson is exactly what flips an
            enrollment to COMPLETED (progression.ts), so this is almost
            always true right here. Links to the enrollment overview's
            #certificate card rather than duplicating its generate/view
            logic in a second place. */}
          {canViewCertificate && (
            <Button asChild className="mt-1">
              <Link href={`/student/learning/${enrollmentId}#certificate`}>
                <Award aria-hidden="true" />
                View your certificate
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* ── Pager ─────────────────────────────────────── */}
      <nav
        aria-label="Lesson navigation"
        className="border-border/70 mt-auto flex items-stretch justify-between gap-3 border-t pt-6"
      >
        {previousEntry ? (
          <Button variant="outline" asChild className="min-w-0">
            <Link href={hrefFor(enrollmentId, previousEntry)}>
              <ArrowLeft aria-hidden="true" />
              <span className="truncate">Previous</span>
            </Link>
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}

        {nextEntry ? (
          nextAvailable ? (
            <Button
              // Once the lesson is done, the way forward is the loudest thing here.
              variant={lessonCompleted || !nextIsNewLesson ? "primary" : "outline"}
              asChild
              className="min-w-0"
            >
              <Link href={hrefFor(enrollmentId, nextEntry)}>
                <span className="truncate">{nextIsNewLesson ? "Next lesson" : "Next"}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <span className="flex min-w-0 flex-col items-end gap-1.5">
              <Button variant="outline" disabled>
                <Lock aria-hidden="true" />
                Next lesson
              </Button>
              <span className="text-muted-foreground text-right text-xs text-pretty">
                {blockedByUnpassedQuiz
                  ? "Pass the quiz to unlock the next lesson."
                  : "Mark this lesson complete to continue."}
              </span>
            </span>
          )
        ) : (
          <span className="text-muted-foreground self-center text-sm">
            {upcomingModuleCount > 0 ? "More modules coming soon." : "You've completed the course!"}
          </span>
        )}
      </nav>
    </article>
  );
}

export { LessonViewer };
