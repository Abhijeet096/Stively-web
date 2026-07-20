"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/sections/empty-state";
import { formatEnrollmentNumber } from "../lib/enrollment-number";
import { EnrollmentStatusBadge } from "./enrollment-status-badge";
import { activateEnrollment, pauseEnrollment, resumeEnrollment, cancelEnrollment, markCompleted } from "../actions/admin-enrollment-actions";
import type { OfferingEnrollment } from "@prisma/client";

/**
 * Replaces OperationDetailView's Phase 7 "Enrollment: Not built yet"
 * placeholder with the real thing - the natural place staff already are
 * when they'd activate a PENDING enrollment created from an Approved
 * request (see createEnrollmentFromRequest's comment on why that's
 * PENDING, not ACTIVE, for a paid offering).
 */
function EnrollmentOpsCard({ enrollment }: { enrollment: OfferingEnrollment | null }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  if (!enrollment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={GraduationCap}
            title="No enrollment yet"
            description="An enrollment is created automatically once this request is approved."
          />
        </CardContent>
      </Card>
    );
  }

  async function run(action: (id: string) => Promise<{ success: boolean }>) {
    setIsPending(true);
    await action(enrollment!.id);
    setIsPending(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Enrollment</CardTitle>
        <EnrollmentStatusBadge status={enrollment.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{formatEnrollmentNumber(enrollment.sequence)}</span>
          <span className="text-foreground font-medium">{enrollment.progressPercentage}% complete</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(enrollment.status === "PENDING" || enrollment.status === "PAUSED") && (
            <Button
              size="sm"
              loading={isPending}
              onClick={() => run(enrollment.status === "PENDING" ? activateEnrollment : resumeEnrollment)}
            >
              {enrollment.status === "PENDING" ? "Activate" : "Resume"}
            </Button>
          )}
          {enrollment.status === "ACTIVE" && (
            <>
              <Button size="sm" variant="outline" loading={isPending} onClick={() => run(pauseEnrollment)}>
                Pause
              </Button>
              <Button size="sm" variant="outline" loading={isPending} onClick={() => run(markCompleted)}>
                Mark completed
              </Button>
            </>
          )}
          {enrollment.status !== "CANCELLED" && enrollment.status !== "COMPLETED" && (
            <Button size="sm" variant="ghost" loading={isPending} onClick={() => run(cancelEnrollment)}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { EnrollmentOpsCard };
