import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Award, UserRound, Download, StickyNote, SearchX } from "lucide-react";

import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getEnrollmentWithHistory } from "@/features/enrollments/server/queries";
import { getAccessPolicyForEnrollment } from "@/features/enrollments/server/access-policy";
import { getCurriculumForEnrollment, searchLessons } from "@/features/learning/server/queries";
import { MyLearningView } from "@/features/enrollments/components/my-learning-view";
import { EnrollmentTimeline } from "@/features/enrollments/components/enrollment-timeline";
import { ComingSoonSection } from "@/features/enrollments/components/coming-soon-section";
import { CertificateCard } from "@/features/certificates/components/student/certificate-card";
import { ProgramProgressHero } from "@/features/learning/components/student/program-progress-hero";
import { CurriculumNav } from "@/features/learning/components/student/curriculum-nav";
import { SearchLessons } from "@/features/learning/components/student/search-lessons";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/sections/empty-state";

interface EnrollmentLearningPageProps {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{ q?: string }>;
}

const OTHER_PLACEHOLDERS = [
  { title: "Assignments", description: "Coursework and submissions will appear here.", icon: ClipboardList },
  { title: "Mentor", description: "Your assigned mentor will show up here.", icon: UserRound },
  { title: "Downloads", description: "Files and recordings you can save.", icon: Download },
  { title: "Notes", description: "Your own notes, saved as you go.", icon: StickyNote },
] as const;

const CERTIFICATES_COMING_SOON = {
  title: "Certificates",
  description: "Earn a certificate once you complete this program.",
  icon: Award,
} as const;

export async function generateMetadata({ params }: EnrollmentLearningPageProps): Promise<Metadata> {
  const { enrollmentId } = await params;
  const user = await requireRole("STUDENT");
  const enrollment = await getEnrollmentWithHistory(enrollmentId, user.id);
  return { title: enrollment?.offering.title ?? "My Learning" };
}

/**
 * The per-enrollment My Learning view. With a real curriculum
 * (LearningExperience exists for this offering): the real progress hero +
 * curriculum nav, driven by getCurriculumForEnrollment (which itself only
 * ever calls getAccessPolicyForEnrollment - never re-derives access).
 * Without one (many offerings don't have curriculum content yet): falls
 * back to Phase 8's exact MyLearningView, so nothing regresses for
 * offerings this phase didn't touch.
 */
export default async function EnrollmentLearningPage({ params, searchParams }: EnrollmentLearningPageProps) {
  const user = await requireRole("STUDENT");
  const { enrollmentId } = await params;
  const { q } = await searchParams;

  const enrollment = await getEnrollmentWithHistory(enrollmentId, user.id);
  if (!enrollment) {
    notFound();
  }

  const policy = await getAccessPolicyForEnrollment(enrollmentId, user.id);
  if (!policy?.canAccessLearning) {
    return (
      <>
        <SetPageTitle title={enrollment.offering.title} />
        <Container className="py-8">
          <EmptyState
            icon={ClipboardList}
            title="Not available yet"
            description={policy?.reason ?? "This enrollment doesn't have access yet."}
          />
        </Container>
      </>
    );
  }

  const curriculum = await getCurriculumForEnrollment(enrollmentId, user.id);

  if (!curriculum) {
    return (
      <>
        <SetPageTitle title={enrollment.offering.title} />
        <Container className="py-8">
          <MyLearningView enrollment={enrollment} history={enrollment.history} />
        </Container>
      </>
    );
  }

  const searchResults = q ? await searchLessons(enrollmentId, user.id, q) : null;
  const certificate = policy.canViewCertificates ? await prisma.certificate.findUnique({ where: { enrollmentId } }) : null;

  return (
    <>
      <SetPageTitle title={enrollment.offering.title} />
      <Container className="flex flex-col gap-8 py-8">
        <ProgramProgressHero enrollment={enrollment} curriculum={curriculum} />

        <SearchLessons />

        {searchResults ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-foreground text-sm font-medium">
              {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for &quot;{q}&quot;
            </h2>
            {searchResults.length === 0 ? (
              <EmptyState icon={SearchX} title="No lessons match" description="Try a different search term." />
            ) : (
              <ul className="flex flex-col gap-2">
                {searchResults.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={`/student/learning/${enrollmentId}/${lesson.id}`}
                      className="text-primary text-sm underline-offset-4 hover:underline"
                    >
                      {lesson.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <CurriculumNav
                enrollmentId={enrollmentId}
                modules={curriculum.modules}
                progressByLessonId={curriculum.progressByLessonId}
              />
            </div>
            <div className="lg:col-span-2">
              <EnrollmentTimeline history={enrollment.history} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {policy.canViewCertificates ? (
            <CertificateCard enrollmentId={enrollmentId} certificate={certificate} />
          ) : (
            <ComingSoonSection {...CERTIFICATES_COMING_SOON} />
          )}
          {OTHER_PLACEHOLDERS.map((section) => (
            <ComingSoonSection key={section.title} {...section} />
          ))}
        </div>
      </Container>
    </>
  );
}
