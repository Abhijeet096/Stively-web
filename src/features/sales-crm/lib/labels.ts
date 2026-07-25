import type {
  SalesLeadSource,
  SalesLeadStatus,
  SalesFollowUpType,
  SalesFollowUpStatus,
  SalesTaskStatus,
  SalesProjectStatus,
  SalesProjectPaymentStatus,
  SalesCommissionStatus,
  LeadPriority,
  TeamMemberRole,
} from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const SALES_LEAD_SOURCE_LABEL: Record<SalesLeadSource, string> = {
  WEBSITE: "Website",
  WHATSAPP: "WhatsApp",
  LINKEDIN: "LinkedIn",
  COLD_CALLING: "Cold Calling",
  REFERRAL: "Referral",
  INDIAMART: "IndiaMART",
  GOOGLE_MAPS: "Google Maps",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  MANUAL: "Manual",
  OTHER: "Other",
};

export const SALES_LEAD_STATUS_LABEL: Record<SalesLeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow Up",
  INTERESTED: "Interested",
  MEETING_SCHEDULED: "Meeting Scheduled",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
  ON_HOLD: "On Hold",
};

export const SALES_LEAD_STATUS_VARIANT: Record<SalesLeadStatus, NonNullable<BadgeProps["variant"]>> = {
  NEW: "outline",
  CONTACTED: "secondary",
  FOLLOW_UP: "warning",
  INTERESTED: "default",
  MEETING_SCHEDULED: "default",
  PROPOSAL_SENT: "warning",
  NEGOTIATION: "warning",
  WON: "success",
  LOST: "destructive",
  ON_HOLD: "secondary",
};

/** Every non-terminal status a pipeline board/funnel walks through, in order - WON/LOST are terminal, excluded here. */
export const SALES_LEAD_PIPELINE_STATUSES: SalesLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
];

export const LEAD_PRIORITY_LABEL: Record<LeadPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const LEAD_PRIORITY_VARIANT: Record<LeadPriority, NonNullable<BadgeProps["variant"]>> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "destructive",
};

export const SALES_FOLLOW_UP_TYPE_LABEL: Record<SalesFollowUpType, string> = {
  CALL: "Call",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  MEETING: "Meeting",
  OTHER: "Other",
};

export const SALES_FOLLOW_UP_STATUS_LABEL: Record<SalesFollowUpStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  RESCHEDULED: "Rescheduled",
  CANCELLED: "Cancelled",
};

export const SALES_FOLLOW_UP_STATUS_VARIANT: Record<SalesFollowUpStatus, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "warning",
  COMPLETED: "success",
  RESCHEDULED: "secondary",
  CANCELLED: "destructive",
};

export const SALES_TASK_STATUS_LABEL: Record<SalesTaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const SALES_TASK_STATUS_VARIANT: Record<SalesTaskStatus, NonNullable<BadgeProps["variant"]>> = {
  TODO: "outline",
  IN_PROGRESS: "warning",
  DONE: "success",
  CANCELLED: "destructive",
};

export const SALES_PROJECT_STATUS_LABEL: Record<SalesProjectStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

export const SALES_PROJECT_STATUS_VARIANT: Record<SalesProjectStatus, NonNullable<BadgeProps["variant"]>> = {
  ACTIVE: "default",
  COMPLETED: "success",
  ON_HOLD: "secondary",
  CANCELLED: "destructive",
};

export const SALES_PROJECT_PAYMENT_STATUS_LABEL: Record<SalesProjectPaymentStatus, string> = {
  PENDING: "Pending",
  DUE: "Due",
  PAID: "Paid",
};

export const SALES_PROJECT_PAYMENT_STATUS_VARIANT: Record<SalesProjectPaymentStatus, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "outline",
  DUE: "warning",
  PAID: "success",
};

export const SALES_COMMISSION_STATUS_LABEL: Record<SalesCommissionStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  PAID: "Paid",
  REJECTED: "Rejected",
};

export const SALES_COMMISSION_STATUS_VARIANT: Record<SalesCommissionStatus, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "warning",
  APPROVED: "default",
  PAID: "success",
  REJECTED: "destructive",
};

/**
 * Display-only labels for the two Sales CRM roles - the brief calls
 * SALESPERSON "Sales Executive"; the underlying TeamMemberRole enum value
 * stays SALESPERSON to avoid touching the already-working Operations
 * AssignmentRole/ELIGIBLE_TEAM_MEMBER_ROLES mapping that depends on it.
 */
export const SALES_TEAM_ROLE_LABEL: Partial<Record<TeamMemberRole, string>> = {
  SALESPERSON: "Sales Executive",
  SALES_MANAGER: "Sales Manager",
  FOUNDER: "Founder",
  ADMIN: "Admin",
};
