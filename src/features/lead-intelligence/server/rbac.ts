import "server-only";

import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type LeadIntelligenceViewer = { hasFullAccess: boolean };

/**
 * Unlike SalesLead (individually assigned, per-row RBAC via
 * resolveSalesCrmViewer), a Business is a shared discovery pool - nobody
 * "owns" a business until it's promoted, so there's no per-row visibility
 * scoping here. `hasFullAccess` instead gates which ACTIONS a viewer can
 * take: full access can trigger connectors and edit scoring weights;
 * everyone with portal access can browse the pool and promote a business
 * to a SalesLead.
 *   - SUPER_ADMIN: full access.
 *   - ADMIN linked to a TeamMember with role FOUNDER/ADMIN/SALES_MANAGER:
 *     full access.
 *   - ADMIN linked to a TeamMember with role SALESPERSON: browse + promote
 *     only.
 *   - ADMIN not linked to any TeamMember: full access - same
 *     "never regress an unlinked admin" fallback used throughout this app.
 */
export async function resolveLeadIntelligenceViewer(userId: string, role: Role): Promise<LeadIntelligenceViewer> {
  if (role === "SUPER_ADMIN") return { hasFullAccess: true };

  const teamMember = await prisma.teamMember.findUnique({ where: { userId } });
  if (!teamMember) return { hasFullAccess: true };
  if (teamMember.role === "FOUNDER" || teamMember.role === "ADMIN" || teamMember.role === "SALES_MANAGER") {
    return { hasFullAccess: true };
  }
  return { hasFullAccess: false };
}
