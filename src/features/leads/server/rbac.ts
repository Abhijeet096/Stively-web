import "server-only";

import { prisma } from "@/lib/prisma";

export type LeadViewer =
  | { canClaim: true; teamMemberId: string }
  | { canClaim: false; teamMemberId: null };

/**
 * Resolves identity for the /sales/inbound viewer. Plain Lead has no
 * manager/rep tiering at the /sales layer (unlike SalesLead's
 * resolveSalesCrmViewer) - every Role.SALES user maps 1:1 to a SALESPERSON
 * TeamMember (via hireAsSalesPerson), and admins already see everything
 * unfiltered at /admin/leads. So this only needs to answer "which
 * TeamMember is this, if any" - the actual unclaimed-or-owned-by-me
 * visibility rule lives in the query (getInboundLeadsForViewer), not here.
 */
export async function resolveLeadViewer(userId: string): Promise<LeadViewer> {
  const teamMember = await prisma.teamMember.findUnique({ where: { userId }, select: { id: true } });
  if (!teamMember) return { canClaim: false, teamMemberId: null };
  return { canClaim: true, teamMemberId: teamMember.id };
}
