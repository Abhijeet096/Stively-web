import "server-only";

import type { Prisma, ReassignmentReason, SalesLeadActivityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Builds the two writes every lead assignment/reassignment needs - a new
 * active SalesLeadAssignment row plus a matching SalesLeadActivity entry.
 * Returns Prisma operations rather than executing them directly so callers
 * can compose them into one $transaction alongside the SalesLead.assignedToId
 * update and (on reassignment) deactivating the previous assignment - same
 * pattern crm.ts's reassignOwner() uses for the Lead CRM.
 */
export function buildAssignmentOps(
  tx: Prisma.TransactionClient,
  params: {
    salesLeadId: string;
    assigneeId: string;
    assignedById: string | null;
    reason: ReassignmentReason;
    activityType: Extract<SalesLeadActivityType, "LEAD_ASSIGNED" | "LEAD_REASSIGNED">;
    activityDescription: string;
  }
) {
  return [
    tx.salesLeadAssignment.create({
      data: {
        salesLeadId: params.salesLeadId,
        assigneeId: params.assigneeId,
        assignedById: params.assignedById,
        reason: params.reason,
      },
    }),
    tx.salesLeadActivity.create({
      data: {
        salesLeadId: params.salesLeadId,
        type: params.activityType,
        description: params.activityDescription,
        performedById: params.assignedById,
      },
    }),
  ];
}

/** Fire-and-observe activity log write - never blocks or fails the caller's main mutation. */
export async function logSalesLeadActivity(params: {
  salesLeadId: string;
  type: SalesLeadActivityType;
  description?: string;
  metadata?: Prisma.InputJsonValue;
  performedById?: string | null;
}): Promise<void> {
  try {
    await prisma.salesLeadActivity.create({
      data: {
        salesLeadId: params.salesLeadId,
        type: params.type,
        description: params.description,
        metadata: params.metadata,
        performedById: params.performedById,
      },
    });
  } catch (error) {
    console.error("logSalesLeadActivity failed:", error);
  }
}
