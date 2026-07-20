import type { LeadStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

/**
 * Maps all 20 LeadStatus values (docs/architecture/lead-intake-system.md
 * §3's wide enum) onto the design system's fixed Badge variant set.
 * Grouped by what the status *means*, not the exact pipeline it belongs
 * to - CONVERTED/INTERESTED both read as positive signals regardless of
 * which pipeline produced them, so both get "success".
 */
const STATUS_VARIANT: Record<
  LeadStatus,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  NEW: "secondary",
  ASSIGNED: "secondary",
  FIRST_CALL: "default",
  INTERESTED: "success",
  CALLBACK_REQUESTED: "default",
  NOT_RESPONDED: "warning",
  NOT_INTERESTED: "destructive",
  COUNSELLING: "default",
  ENROLLMENT: "default",
  PAYMENT: "default",
  INITIAL_CONTACT: "default",
  WHATSAPP_DISCUSSION: "default",
  DISCOVERY_CALL: "default",
  REQUIREMENTS_GATHERING: "default",
  PROPOSAL_SENT: "default",
  NEGOTIATION: "default",
  PROJECT_APPROVED: "default",
  DEVELOPMENT_STARTED: "default",
  CONVERTED: "success",
  LOST: "destructive",
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "New",
  ASSIGNED: "Assigned",
  FIRST_CALL: "First Call",
  INTERESTED: "Interested",
  CALLBACK_REQUESTED: "Callback Requested",
  NOT_RESPONDED: "Not Responded",
  NOT_INTERESTED: "Not Interested",
  COUNSELLING: "Counselling",
  ENROLLMENT: "Enrollment",
  PAYMENT: "Payment",
  INITIAL_CONTACT: "Initial Contact",
  WHATSAPP_DISCUSSION: "WhatsApp Discussion",
  DISCOVERY_CALL: "Discovery Call",
  REQUIREMENTS_GATHERING: "Requirements Gathering",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  PROJECT_APPROVED: "Project Approved",
  DEVELOPMENT_STARTED: "Development Started",
  CONVERTED: "Converted",
  LOST: "Lost",
};

function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export { LeadStatusBadge, STATUS_LABEL };
