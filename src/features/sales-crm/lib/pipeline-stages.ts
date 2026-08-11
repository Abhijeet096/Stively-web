import type { SalesLeadStatus } from "@prisma/client";

export interface PipelineStage {
  key: string;
  label: string;
  statuses: SalesLeadStatus[];
}

/**
 * Coarse groupings over SalesLeadStatus for the "Qualified Clients" quick
 * filter - every SalesLead is already a qualified client the moment it
 * exists (it only ever gets created via a promotion bridge - Lead, Business,
 * or OfferingRequest - or a deliberate manual add), regardless of where it
 * sits in the pipeline. These groups answer "which stage," not "is this a
 * client" - that's why WON isn't the only bucket shown here (see AD-016).
 * ON_HOLD is deliberately not folded into LOST - it's a real, different
 * state (paused, not dead) - still reachable via the fine-grained Status
 * dropdown in the filters toolbar, just not one of these five quick chips.
 */
export const PIPELINE_STAGES: PipelineStage[] = [
  { key: "qualified", label: "Qualified", statuses: ["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "MEETING_SCHEDULED"] },
  { key: "proposal", label: "Proposal Sent", statuses: ["PROPOSAL_SENT"] },
  { key: "negotiating", label: "Negotiating", statuses: ["NEGOTIATION"] },
  { key: "won", label: "Won", statuses: ["WON"] },
  { key: "lost", label: "Lost", statuses: ["LOST"] },
];

export function getPipelineStage(key: string | undefined): PipelineStage | undefined {
  return PIPELINE_STAGES.find((stage) => stage.key === key);
}
