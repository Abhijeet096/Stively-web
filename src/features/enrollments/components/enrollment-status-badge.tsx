import type { OfferingEnrollmentStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { ENROLLMENT_STATUS_LABEL, ENROLLMENT_STATUS_BADGE_VARIANT } from "../lib/status-labels";

function EnrollmentStatusBadge({ status }: { status: OfferingEnrollmentStatus }) {
  return <Badge variant={ENROLLMENT_STATUS_BADGE_VARIANT[status]}>{ENROLLMENT_STATUS_LABEL[status]}</Badge>;
}

export { EnrollmentStatusBadge };
