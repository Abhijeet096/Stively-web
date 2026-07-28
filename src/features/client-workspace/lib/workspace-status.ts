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

/** No AI/derived scoring - just a plain-language read of real, already-known state (whether a project exists yet, and its status if so). */
export function getWorkspacePhase(project: { status: SalesProjectStatus } | null): WorkspacePhase {
  if (!project) return { label: "Proposal & onboarding", variant: "secondary" };
  return PROJECT_STATUS_PHASE[project.status];
}
