import Link from "next/link";
import { Users } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { MentorAvatar } from "../shared/mentor-avatar";
import { MENTOR_TYPE_LABEL } from "../../lib/mentor-types";
import type { getMentorForOperationsCard } from "../../server/queries";

type Assignment = Awaited<ReturnType<typeof getMentorForOperationsCard>>[number];

/**
 * Mirrors EnrollmentOpsCard exactly - read-only, no action buttons (mentor
 * assignment is managed from /admin/mentors, not from Operations), fed by
 * a query keyed off the same enrollment.studentId the page already
 * resolves. Zero shared workflow logic touched.
 */
function MentorOpsCard({ assignments }: { assignments: Assignment[] }) {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mentor</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Users} title="No mentor assigned" description="Assign one from the Mentors section." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mentor</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {assignments.map((assignment) => (
          <Link
            key={assignment.id}
            href={`/admin/mentors/${assignment.mentorId}`}
            className="hover:bg-accent flex items-center gap-3 rounded-lg p-2 -m-2 transition-colors"
          >
            <MentorAvatar name={assignment.mentor.user.name} photoUrl={assignment.mentor.profilePhotoUrl} />
            <div className="flex flex-1 flex-col">
              <span className="text-foreground text-sm font-medium">{assignment.mentor.user.name}</span>
              <span className="text-muted-foreground text-xs">{MENTOR_TYPE_LABEL[assignment.mentor.type]}</span>
            </div>
            {assignment.isPrimary && <Badge variant="secondary">Primary</Badge>}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export { MentorOpsCard };
