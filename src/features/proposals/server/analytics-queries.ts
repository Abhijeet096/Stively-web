import "server-only";

import { prisma } from "@/lib/prisma";
import type { SalesCrmViewer } from "@/features/sales-crm/server/rbac";

export interface ProposalEngagement {
  /** Real distinct browser sessions that opened the public page - not the same as Proposal.viewCount, which is a simple render counter incremented on every load. */
  totalSessions: number;
  totalActiveMinutes: number;
  sectionMinutes: { key: string; minutes: number }[];
}

/** RBAC-scoped the same way every other proposal read is - full access, or only the assigned salesperson's own lead. */
export async function getProposalEngagement(proposalId: string, viewer: SalesCrmViewer): Promise<ProposalEngagement | null> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { salesLead: { select: { assignedToId: true } } },
  });
  if (!proposal) return null;
  if (!viewer.hasFullAccess && proposal.salesLead.assignedToId !== viewer.teamMemberId) return null;

  const [pageViews, sectionViews] = await Promise.all([
    prisma.proposalPageView.findMany({ where: { proposalId }, select: { totalActiveMs: true } }),
    prisma.proposalSectionView.groupBy({ by: ["sectionKey"], where: { proposalId }, _sum: { activeMs: true } }),
  ]);

  const totalActiveMs = pageViews.reduce((sum, v) => sum + v.totalActiveMs, 0);

  return {
    totalSessions: pageViews.length,
    totalActiveMinutes: Math.round(totalActiveMs / 60000),
    sectionMinutes: sectionViews
      .map((s) => ({ key: s.sectionKey, minutes: Math.round((s._sum.activeMs ?? 0) / 60000) }))
      .filter((s) => s.minutes > 0),
  };
}
