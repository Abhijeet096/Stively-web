import type { ProposalStatus } from "@prisma/client";

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  INTERNAL_REVIEW: "Internal review",
  SENT: "Sent",
  VIEWED: "Viewed",
  COMMENTED: "Commented",
  REVISION_REQUESTED: "Revision requested",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export const PROPOSAL_STATUS_VARIANT: Record<ProposalStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  INTERNAL_REVIEW: "secondary",
  SENT: "default",
  VIEWED: "default",
  COMMENTED: "warning",
  REVISION_REQUESTED: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
  EXPIRED: "outline",
};
