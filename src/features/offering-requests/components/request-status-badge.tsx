import type { RequestStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { REQUEST_STATUS_LABEL, REQUEST_STATUS_BADGE_VARIANT } from "../lib/status-labels";

/** The one place every surface (request-card, request-detail-view, request-timeline) reads status -> visual treatment from. */
function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge variant={REQUEST_STATUS_BADGE_VARIANT[status]}>{REQUEST_STATUS_LABEL[status]}</Badge>;
}

export { RequestStatusBadge };
