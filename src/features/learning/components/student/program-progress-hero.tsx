import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnrollmentStatusBadge } from "@/features/enrollments/components/enrollment-status-badge";
import { ProgressCard } from "@/features/enrollments/components/progress-card";
import type { EnrollmentWithOffering } from "@/features/enrollments/server/queries";
import type { Curriculum } from "../../server/queries";

/** Replaces Phase 8's static progress display on /student/learning/[enrollmentId] with real curriculum data - real "Continue Learning" destination, real duration/module info. */
function ProgramProgressHero({ enrollment, curriculum }: { enrollment: EnrollmentWithOffering; curriculum: Curriculum }) {
  const continueHref = curriculum.nextLesson
    ? `/student/learning/${enrollment.id}/${curriculum.nextLesson.id}`
    : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <EnrollmentStatusBadge status={enrollment.status} />
          <CardTitle className="font-display text-2xl">{curriculum.title}</CardTitle>
          <CardDescription>{enrollment.offering.shortDescription}</CardDescription>
        </div>
        {continueHref ? (
          <Button asChild size="lg">
            <Link href={continueHref}>Continue learning</Link>
          </Button>
        ) : (
          <Button size="lg" disabled>
            All lessons complete
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-6 border-t border-border/70 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <ProgressCard progressPercentage={enrollment.progressPercentage} />
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Duration</span>
          <span className="text-foreground text-sm">{enrollment.offering.duration ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Current module</span>
          <span className="text-foreground text-sm">{enrollment.currentModule ?? "Not started yet"}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export { ProgramProgressHero };
