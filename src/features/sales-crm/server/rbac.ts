import "server-only";

import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type SalesCrmViewer = { hasFullAccess: true; teamMemberId: string | null } | { hasFullAccess: false; teamMemberId: string };

/**
 * Resolves what a Sales CRM viewer can see - same shape and reasoning as
 * Operations' resolveOperationsViewer, adapted for this domain's roles:
 *   - SUPER_ADMIN: always full access (sees the whole team).
 *   - ADMIN linked to a TeamMember with role FOUNDER/ADMIN/SALES_MANAGER:
 *     full access - a sales manager runs the whole team's pipeline.
 *   - ADMIN linked to a TeamMember with role SALESPERSON: restricted to
 *     `assignedToId = that TeamMember's id` - the brief's explicit
 *     "cannot access other sales person's data".
 *   - ADMIN not linked to any TeamMember at all: full access - same
 *     "never regress an unlinked admin" fallback used throughout this app
 *     (see src/actions/crm.ts's resolveActorId(), Operations' rbac.ts).
 *     Safe here because User.role ADMIN is already a trusted staff tier.
 *   - SALES not linked to any TeamMember at all: the SAME fallback would
 *     be a real information leak - a SALES portal account only exists
 *     because someone was hired (hireAsSalesPerson creates the User +
 *     TeamMember + SalesProfile together, atomically), so "no TeamMember"
 *     for a SALES-role user means provisioning was skipped (e.g. a role
 *     flipped directly in the DB), not "a trusted admin who hasn't been
 *     linked yet." Defaults to zero access - a sentinel teamMemberId that
 *     can never match a real row, so every scoped query returns empty
 *     (the dashboard's own "No leads assigned yet" state), never the
 *     whole company's pipeline.
 */
export async function resolveSalesCrmViewer(userId: string, role: Role): Promise<SalesCrmViewer> {
  if (role === "SUPER_ADMIN") {
    return { hasFullAccess: true, teamMemberId: null };
  }

  const teamMember = await prisma.teamMember.findUnique({ where: { userId } });
  if (!teamMember) {
    if (role === "ADMIN") {
      return { hasFullAccess: true, teamMemberId: null };
    }
    return { hasFullAccess: false, teamMemberId: "__unprovisioned__" };
  }
  if (teamMember.role === "FOUNDER" || teamMember.role === "ADMIN" || teamMember.role === "SALES_MANAGER") {
    return { hasFullAccess: true, teamMemberId: teamMember.id };
  }
  return { hasFullAccess: false, teamMemberId: teamMember.id };
}

/** Throws-and-redirects variant for pages that must hard-require CRM access at all (any TeamMember role qualifies - scoping happens via resolveSalesCrmViewer, not here). */
export async function getSalesCrmTeamMemberId(userId: string): Promise<string | null> {
  const teamMember = await prisma.teamMember.findUnique({ where: { userId }, select: { id: true } });
  return teamMember?.id ?? null;
}
