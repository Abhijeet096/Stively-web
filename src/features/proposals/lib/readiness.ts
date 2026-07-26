import type { SalesLeadDiscovery } from "@prisma/client";

export interface ProposalReadiness {
  ready: boolean;
  /** Human-readable labels of whatever's still missing - shown next to the disabled Generate Proposal button. */
  missing: string[];
}

/**
 * Pure, zero-I/O - deliberately NOT in server/discovery-queries.ts despite
 * being about discovery data, so client components (discovery-checklist-
 * panel.tsx's live readiness preview) can import it directly without
 * pulling in that file's `import "server-only"` Prisma access. "Ready for
 * proposal" is always computed here, never stored as its own boolean - same
 * "derive, don't duplicate" discipline as formatSalesLeadNumber deriving a
 * display string from SalesLead.sequence. A proposal must never be
 * generated before discovery is captured (the brief's explicit
 * requirement), so this is the single gate both the UI's disabled-button
 * state and generateProposal's server-side guard check.
 */
export function computeProposalReadiness(discovery: SalesLeadDiscovery | null): ProposalReadiness {
  const missing: string[] = [];

  if (!discovery?.budgetDiscussed) missing.push("Budget discussed");
  if (!discovery?.timelineDiscussed) missing.push("Timeline discussed");
  if (!discovery?.decisionMakerIdentified) missing.push("Decision maker identified");
  if (!discovery?.requirementsCaptured) missing.push("Requirements captured");
  if (!discovery || discovery.selectedOfferingIds.length === 0) missing.push("At least one service selected");

  return { ready: missing.length === 0, missing };
}
