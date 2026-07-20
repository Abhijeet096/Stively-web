import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/session";
import { getStudentAccessSummary } from "@/features/enrollments/server/access-policy";
import { NoAccessView } from "@/features/enrollments/components/no-access-view";
import { EnrollmentStatusBadge } from "@/features/enrollments/components/enrollment-status-badge";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "My Learning" };

/**
 * The My Learning hub. With no access: NoAccessView (Phase 8) - never
 * Assignments/Mentor/Certificates/Progress. With exactly one active
 * enrollment (the common case): redirect straight into it, no pointless
 * intermediate click. With more than one: list them as cards - a real
 * multi-enrollment case Phase 8 didn't need to handle yet.
 */
export default async function StudentLearningPage() {
  const user = await requireRole("STUDENT");
  const summary = await getStudentAccessSummary(user.id);

  if (!summary.hasAnyAccess) {
    return (
      <>
        <SetPageTitle title="My Learning" />
        <Container className="py-8">
          <NoAccessView />
        </Container>
      </>
    );
  }

  if (summary.activeEnrollments.length === 1) {
    redirect(`/student/learning/${summary.activeEnrollments[0].id}`);
  }

  return (
    <>
      <SetPageTitle title="My Learning" />
      <Container className="flex flex-col gap-6 py-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">My Learning</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summary.activeEnrollments.map((enrollment) => (
            <Link key={enrollment.id} href={`/student/learning/${enrollment.id}`}>
              <Card variant="interactive" className="h-full">
                <CardHeader>
                  <EnrollmentStatusBadge status={enrollment.status} />
                  <CardTitle className="font-display">{enrollment.offering.title}</CardTitle>
                  <CardDescription>{enrollment.offering.shortDescription}</CardDescription>
                </CardHeader>
                <CardFooter className="border-border/70 mt-auto border-t pt-4">
                  <span className="text-foreground text-sm font-medium">{enrollment.progressPercentage}% complete</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
