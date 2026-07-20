import type { LiveSessionType, LiveSessionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { SESSION_TYPE_LABEL, SESSION_STATUS_LABEL, SESSION_STATUS_BADGE_VARIANT } from "../../lib/session-types";

function SessionTypeBadge({ type }: { type: LiveSessionType }) {
  return <Badge variant="outline">{SESSION_TYPE_LABEL[type]}</Badge>;
}

function SessionStatusBadge({ status }: { status: LiveSessionStatus }) {
  return <Badge variant={SESSION_STATUS_BADGE_VARIANT[status]}>{SESSION_STATUS_LABEL[status]}</Badge>;
}

export { SessionTypeBadge, SessionStatusBadge };
