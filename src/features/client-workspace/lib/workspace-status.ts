import type { SalesProjectStatus } from "@prisma/client";

export type WorkspacePhaseVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

export interface WorkspacePhase {
  label: string;
  variant: WorkspacePhaseVariant;
}

const PROJECT_STATUS_PHASE: Record<SalesProjectStatus, WorkspacePhase> = {
  ACTIVE: { label: "In progress", variant: "default" },
  COMPLETED: { label: "Delivered", variant: "success" },
  ON_HOLD: { label: "On hold", variant: "warning" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

/**
 * No AI/derived scoring - just a plain-language read of real, already-known
 * state. A client can now have several projects - the "headline" phase is
 * whichever ACTIVE one exists (there's usually at most one being worked at
 * a time), falling back to the most recently created project otherwise.
 */
export function getWorkspacePhase(projects: { status: SalesProjectStatus }[]): WorkspacePhase {
  if (projects.length === 0) return { label: "Proposal & onboarding", variant: "secondary" };
  const active = projects.find((p) => p.status === "ACTIVE");
  return PROJECT_STATUS_PHASE[(active ?? projects[0]).status];
}
