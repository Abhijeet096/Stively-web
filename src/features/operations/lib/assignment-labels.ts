import type { AssignmentRole, TeamMemberRole } from "@prisma/client";

export const ASSIGNMENT_ROLE_LABEL: Record<AssignmentRole, string> = {
  COUNSELLOR: "Counsellor",
  SALES: "Sales",
  SUPPORT: "Support",
  MENTOR: "Mentor",
};

/**
 * Which TeamMemberRole is eligible to be assigned in each capacity - the
 * assignment picker (AssignmentPanel) filters to this list. MENTOR maps to
 * an empty array on purpose: no TeamMemberRole exists for it yet (see
 * prisma/schema.prisma's AssignmentRole comment) - assigning one is a
 * documented but currently-impossible action, not a silently broken one.
 */
export const ELIGIBLE_TEAM_MEMBER_ROLES: Record<AssignmentRole, TeamMemberRole[]> = {
  COUNSELLOR: ["COUNSELLOR", "FOUNDER", "ADMIN"],
  SALES: ["SALESPERSON", "FOUNDER", "ADMIN"],
  SUPPORT: ["SUPPORT", "FOUNDER", "ADMIN"],
  MENTOR: [],
};
