import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnrollmentStatusBadge } from "./enrollment-status-badge";
import { ProgressCard } from "./progress-card";
import { EnrollmentTimeline } from "./enrollment-timeline";
import { SupportCard } from "./support-card";
import type { EnrollmentWithOffering } from "../server/queries";
import type { EnrollmentHistory } from "@prisma/client";

/**
 * The premium "My Learning" landing page body - current program, progress,
 * status, duration, and timeline. No real lessons exist yet for this
 * offering (that's the future LMS phase), so "Continue Learning" links to
 * the offering's own detail page for now - the most honest real destination
 * available today, not a dead button. Only ever shows real, working
 * sections - assignments/resources/downloads/notes stay off this page
 * entirely until they're actually built, rather than a row of "coming
 * soon" cards promising features that don't exist yet.
 */
function MyLearningView({
  enrollment,
  history,
}: {
  enrollment: EnrollmentWithOffering;
  history: EnrollmentHistory[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <Card className="overflow-hidden">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <EnrollmentStatusBadge status={enrollment.status} />
            <CardTitle className="font-display text-2xl">{enrollment.offering.title}</CardTitle>
            <CardDescription>{enrollment.offering.shortDescription}</CardDescription>
          </div>
          <Button asChild size="lg">
            <Link href={`/offerings/${enrollment.offering.slug}`}>Continue learning</Link>
          </Button>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EnrollmentTimeline history={history} />
        </div>
        <SupportCard />
      </div>
    </div>
  );
}

export { MyLearningView };
