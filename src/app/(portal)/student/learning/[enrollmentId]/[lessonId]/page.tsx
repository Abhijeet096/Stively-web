import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/session";
import { getCurriculumForEnrollment, getLessonForStudent } from "@/features/learning/server/queries";
import { markLessonStarted } from "@/features/learning/actions/progress-actions";
import { LessonViewer } from "@/features/learning/components/student/lesson-viewer";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";

interface LessonPageProps {
  params: Promise<{ enrollmentId: string; lessonId: string }>;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { enrollmentId, lessonId } = await params;
  const user = await requireRole("STUDENT");
  const lessonView = await getLessonForStudent(lessonId, enrollmentId, user.id);
  return { title: lessonView?.lesson.title ?? "Lesson" };
}

/**
 * The Lesson Viewer - access, ownership, and unlock status are all
 * re-verified here (never trusts the curriculum nav's client-side lock
 * icons alone). A locked lesson reached by direct URL bounces back to the
 * program overview, not a silent 404 - the brief's explicit
 * "redirect... not a silent 404" for locked content.
 */
export default async function LessonPage({ params }: LessonPageProps) {
  const user = await requireRole("STUDENT");
  const { enrollmentId, lessonId } = await params;

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

  return (
    <>
      <SetPageTitle title={lessonView.lesson.title} />
      <Container className="py-8">
        <LessonViewer enrollmentId={enrollmentId} curriculum={curriculum} lessonView={lessonView} />
      </Container>
    </>
  );
}
