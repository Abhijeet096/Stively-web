import "server-only";

import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type OperationsViewer = { hasFullAccess: true } | { hasFullAccess: false; teamMemberId: string };

/**
 * Resolves what an Operations viewer can see. Portal `Role` (ADMIN/
 * SUPER_ADMIN) already gates the whole `(dashboard)` route group - this
 * layer decides, within that, whether they see every OperationItem or only
 * ones assigned to them:
 *   - SUPER_ADMIN: always full access (superset of ADMIN, same precedent
 *     as /ceo/dashboard's existing comment).
 *   - ADMIN linked to a TeamMember with role FOUNDER/ADMIN: full access.
 *   - ADMIN linked to a TeamMember with role COUNSELLOR/SALESPERSON/
 *     SUPPORT: restricted to `assignedToId = that TeamMember's id`.
 *   - ADMIN not linked to any TeamMember at all: full access - same
 *     "never regress an admin who hasn't been linked yet" fallback
 *     src/actions/crm.ts's resolveActorId() already established for Leads.
 */
export async function resolveOperationsViewer(userId: string, role: Role): Promise<OperationsViewer> {
  if (role === "SUPER_ADMIN") {
    return { hasFullAccess: true };
  }

  const teamMember = await prisma.teamMember.findUnique({ where: { userId } });
  if (!teamMember) {
    return { hasFullAccess: true };
  }
  if (teamMember.role === "FOUNDER" || teamMember.role === "ADMIN") {
    return { hasFullAccess: true };
  }
  return { hasFullAccess: false, teamMemberId: teamMember.id };
}
