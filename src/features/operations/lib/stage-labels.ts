import type { RequestStatus, RequestType, OrderStatus } from "@prisma/client";

/**
 * The brief's "configurable status pipeline" - a per-type ordered stage
 * list + label map, not a second status system. RequestStatus.UNDER_REVIEW
 * is the same real column value for a Student and a Business request; it
 * just reads as "Review" vs "Lead" here, matching the brief's exact
 * Student (Submitted -> Review -> Counselling -> Approved -> Waiting
 * Payment -> Enrolled) and Business (Submitted -> Lead -> Meeting ->
 * Proposal -> Negotiation -> Won) pipeline wording without adding
 * business-specific enum values to a live model. Edit this map to
 * reconfigure the pipeline - no schema or action changes needed.
 */
export const REQUEST_PIPELINE: RequestStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "COUNSELLING_SCHEDULED",
  "APPROVED",
  "WAITING_FOR_PAYMENT",
  "COMPLETED",
];

const REQUEST_STAGE_LABEL: Record<RequestType, Partial<Record<RequestStatus, string>>> = {
  STUDENT: {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Review",
    COUNSELLING_SCHEDULED: "Counselling",
    APPROVED: "Approved",
    WAITING_FOR_PAYMENT: "Waiting Payment",
    COMPLETED: "Enrolled",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  },
  BUSINESS: {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Lead",
    COUNSELLING_SCHEDULED: "Meeting",
    APPROVED: "Proposal Sent",
    WAITING_FOR_PAYMENT: "Negotiation",
    COMPLETED: "Won",
    REJECTED: "Lost",
    CANCELLED: "Cancelled",
  },
};

export function getRequestStageLabel(status: RequestStatus, requestType: RequestType): string {
  return REQUEST_STAGE_LABEL[requestType][status] ?? status;
}

export function getRequestPipeline(requestType: RequestType): { status: RequestStatus; label: string }[] {
  return REQUEST_PIPELINE.map((status) => ({ status, label: getRequestStageLabel(status, requestType) }));
}

/** Order's pipeline is inherently shallower - no business-specific wording requested for it. */
export const ORDER_PIPELINE: OrderStatus[] = ["PENDING", "PAID"];

export const ORDER_STAGE_LABEL: Record<OrderStatus, string> = {
  PENDING: "Payment Pending",
  PAID: "Paid",
  FAILED: "Payment Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};
