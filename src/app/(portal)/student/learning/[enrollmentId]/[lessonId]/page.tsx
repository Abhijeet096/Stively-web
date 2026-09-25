import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/session";
import { getAccessPolicyForEnrollment } from "@/features/enrollments/server/access-policy";
import { getCurriculumForEnrollment, getLessonForStudent } from "@/features/learning/server/queries";
import { markLessonStarted } from "@/features/learning/actions/progress-actions";
import { LessonViewer } from "@/features/learning/components/student/lesson-viewer";
import { CourseSidebar } from "@/features/learning/components/student/course-sidebar";
import { CourseNavDrawer } from "@/features/learning/components/student/course-nav-drawer";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";

interface LessonPageProps {
  params: Promise<{ enrollmentId: string; lessonId: string }>;
  searchParams: Promise<{ item?: string }>;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { enrollmentId, lessonId } = await params;
  const user = await requireRole("STUDENT");
  const lessonView = await getLessonForStudent(lessonId, enrollmentId, user.id);
  return { title: lessonView?.lesson.title ?? "Lesson" };
}

/**
 * The course player. Access, ownership and unlock status are all
 * re-verified here - the sidebar's lock icons are display only, so a
 * hand-typed URL into gated content still bounces back to the course
 * overview rather than rendering it.
 *
 * The selected learning item rides in `?item=` so the browser back button
 * and a refresh both land exactly where the learner was, and every sidebar
 * entry is a real, shareable URL.
 */
export default async function LessonPage({ params, searchParams }: LessonPageProps) {
  const user = await requireRole("STUDENT");
  const { enrollmentId, lessonId } = await params;
  const { item } = await searchParams;

  const curriculum = await getCurriculumForEnrollment(enrollmentId, user.id);
  if (!curriculum) {
    notFound();
  }

  const lessonView = await getLessonForStudent(lessonId, enrollmentId, user.id);
  if (!lessonView) {
    notFound();
  }
  if (!lessonView.isUnlocked) {
    redirect(`/student/learning/${enrollmentId}`);
  }

  if (lessonView.progress?.status !== "COMPLETED" && lessonView.progress?.status !== "IN_PROGRESS") {
    await markLessonStarted(enrollmentId, lessonId);
  }

  // Only fetched for the "you're all caught up" panel's certificate link
  // (see LessonViewer) - reuses the same access-policy check the
  // enrollment overview page already gates CertificateCard on, so this
  // never claims a certificate is available when canViewCertificates
  // wouldn't actually render one there.
  const policy = await getAccessPolicyForEnrollment(enrollmentId, user.id);

  // An unknown or missing ?item falls back to the lesson's first item rather
  // than rendering nothing - covers old links and hand-edited URLs.
  const items = curriculum.itemsByLessonId.get(lessonId) ?? [];
  const activeItemId = items.some((i) => i.id === item) ? item : items[0]?.id;

  const sidebar = (
    <CourseSidebar
      enrollmentId={enrollmentId}
      courseTitle={curriculum.title}
      modules={curriculum.modules}
      progressByLessonId={curriculum.progressByLessonId}
      itemsByLessonId={curriculum.itemsByLessonId}
      progressPercentage={curriculum.progressPercentage}
      completedLessons={curriculum.completedLessons}
      totalLessons={curriculum.totalLessons}
      activeLessonId={lessonId}
      activeItemId={activeItemId}
    />
  );

  return (
    <>
      <SetPageTitle title={lessonView.lesson.title} />

      {/*
        The portal's <main> is the scroll container and already begins below
        the 64px app header, so everything pinned in here anchors at top-0.
        Offsetting by the header height instead would push these 64px into
        the content and float them over the lesson.
      */}
      <div className="flex min-h-full flex-col lg:flex-row">
        {/* Desktop rail - scrolls independently of the lesson beside it. */}
        <aside className="border-border/70 hidden w-[300px] shrink-0 border-r lg:block xl:w-[340px]">
          <div className="sticky top-0 h-[calc(100vh-4rem)]">{sidebar}</div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile course bar - opaque, not translucent: it sits over scrolling body text. */}
          <div className="border-border/70 bg-background sticky top-0 z-20 border-b lg:hidden">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <CourseNavDrawer label={curriculum.title}>{sidebar}</CourseNavDrawer>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-muted-foreground truncate text-[11px]">
                  {curriculum.completedLessons} of {curriculum.totalLessons} lessons completed
                </span>
                <span className="text-foreground truncate text-sm font-medium">{curriculum.title}</span>
              </div>
              <span className="text-foreground shrink-0 text-sm font-semibold tabular-nums">
                {curriculum.progressPercentage}%
              </span>
            </div>
            {/* Progress reads as part of the bar itself rather than another stacked row. */}
            <div className="bg-muted h-0.5 w-full" aria-hidden="true">
              <div className="bg-primary h-full" style={{ width: `${curriculum.progressPercentage}%` }} />
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
            <LessonViewer
              enrollmentId={enrollmentId}
              curriculum={curriculum}
              lessonView={lessonView}
              activeItemId={activeItemId}
              canViewCertificate={policy?.canViewCertificates ?? false}
              canDownloadResources={policy?.canDownloadResources ?? false}
            />
          </div>
        </div>
      </div>
    </>
  );
}
