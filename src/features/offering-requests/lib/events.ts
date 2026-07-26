import type { OfferingRequest } from "@prisma/client";

export type OfferingRequestEventType =
  | "REQUEST_SUBMITTED"
  | "STATUS_CHANGED"
  | "COUNSELLING_SCHEDULED"
  | "APPROVED"
  | "REJECTED"
  | "PAYMENT_REMINDER"
  | "QUOTE_PROPOSED"
  | "QUOTE_APPROVED"
  | "QUOTE_REJECTED";

/**
 * The single call site every status-changing action in this feature
 * already calls (see request-actions.ts, admin-request-actions.ts). Logs
 * today; wiring real email/notification delivery later is a body-only
 * change here, not a new call-site hunt across the codebase - this is the
 * brief's "Email/Notification: architecture only" requirement made real.
 */
export function emitOfferingRequestEvent(
  type: OfferingRequestEventType,
  request: Pick<OfferingRequest, "id" | "userId" | "status">
): void {
  console.log(`[offering-request-event] ${type}`, {
    requestId: request.id,
    userId: request.userId,
    status: request.status,
  });
}
