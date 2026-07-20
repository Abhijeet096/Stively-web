import type { MentorAssignmentStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { MENTOR_ASSIGNMENT_STATUS_LABEL, MENTOR_ASSIGNMENT_STATUS_BADGE_VARIANT } from "../../lib/mentor-types";

function MentorAssignmentStatusBadge({ status }: { status: MentorAssignmentStatus }) {
  return <Badge variant={MENTOR_ASSIGNMENT_STATUS_BADGE_VARIANT[status]}>{MENTOR_ASSIGNMENT_STATUS_LABEL[status]}</Badge>;
}

export { MentorAssignmentStatusBadge };
