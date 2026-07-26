import type { LostReason } from "@prisma/client";

/** Reuses Lead's LostReason enum (see prisma/schema.prisma's SalesLead.lostReason comment) - no existing label map for it anywhere else in the codebase, so this is the first one. */
export const LOST_REASON_LABEL: Record<LostReason, string> = {
  FINANCIAL_ISSUE: "Financial issue",
  PARENTS_REJECTED: "Parents rejected",
  JOINED_ANOTHER_INSTITUTE: "Joined another institute",
  NO_TIME: "No time",
  NOT_ELIGIBLE: "Not eligible",
  BUDGET_ISSUE: "Budget issue",
  COMPETITOR_WON: "Competitor won",
  ALREADY_HIRED_AGENCY: "Already hired an agency",
  INTERNAL_TEAM: "Using internal team",
  POSTPONED: "Postponed",
  CANCELLED: "Cancelled",
  NO_RESPONSE: "No response",
};
