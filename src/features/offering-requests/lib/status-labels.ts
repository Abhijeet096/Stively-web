import type { RequestStatus, RequestType, RequestPriority, PaymentStatus, PreferredContactMethod } from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  STUDENT: "Student",
  BUSINESS: "Business",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  COUNSELLING_SCHEDULED: "Counselling scheduled",
  WAITING_FOR_PAYMENT: "Waiting for payment",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

/** One place every surface (request-status-badge.tsx, request-timeline.tsx) reads status -> visual treatment from. */
export const REQUEST_STATUS_BADGE_VARIANT: Record<RequestStatus, NonNullable<BadgeProps["variant"]>> = {
  DRAFT: "outline",
  SUBMITTED: "secondary",
  UNDER_REVIEW: "warning",
  COUNSELLING_SCHEDULED: "secondary",
  WAITING_FOR_PAYMENT: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  CANCELLED: "outline",
  COMPLETED: "success",
};

/**
 * The "main" lifecycle stages shown on the Status Timeline (request-timeline.tsx)
 * even before a request has reached them - so a Submitted request visibly
 * shows "Under Review", "Approved", "Completed" as upcoming, not just its
 * one current status. Terminal/off-path statuses (Rejected, Cancelled,
 * Waiting for Payment) render as a one-off event instead, not a step on
 * this rail - see request-timeline.tsx.
 */
export const REQUEST_TIMELINE_STAGES: RequestStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "COUNSELLING_SCHEDULED",
  "APPROVED",
  "COMPLETED",
];

export const REQUEST_PRIORITY_LABEL: Record<RequestPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  NOT_REQUIRED: "Not required",
  PENDING: "Payment pending",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

export const CONTACT_METHOD_LABEL: Record<PreferredContactMethod, string> = {
  EMAIL: "Email",
  PHONE: "Phone",
  WHATSAPP: "WhatsApp",
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
};

export const CONTACT_METHOD_OPTIONS: { value: PreferredContactMethod; label: string }[] = (
  Object.entries(CONTACT_METHOD_LABEL) as [PreferredContactMethod, string][]
).map(([value, label]) => ({ value, label }));
