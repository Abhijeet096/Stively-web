import "server-only";

import { prisma } from "@/lib/prisma";
import type { SalesCrmViewer } from "@/features/sales-crm/server/rbac";

const proposalDetailInclude = {
  salesLead: true,
  versions: { orderBy: { versionNumber: "desc" as const } },
  comments: { orderBy: { createdAt: "asc" as const } },
  meetingRequests: { orderBy: { createdAt: "desc" as const } },
};

/** Every proposal ever generated for this lead, newest first - RBAC-scoped the same way every other sales-crm read is (full access, or only the assigned salesperson's own lead). */
export async function getProposalsForLead(salesLeadId: string, viewer: SalesCrmViewer) {
  const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
  if (!lead) return null;
  if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) return null;

  return prisma.proposal.findMany({ where: { salesLeadId }, orderBy: { createdAt: "desc" } });
}

/** The most recent non-expired proposal for a lead - what the UI treats as "the active proposal" (a lead can accumulate more than one over time). */
export async function getActiveProposalForLead(salesLeadId: string, viewer: SalesCrmViewer) {
  const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
  if (!lead) return null;
  if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) return null;

  return prisma.proposal.findFirst({
    where: { salesLeadId, status: { not: "EXPIRED" } },
    orderBy: { createdAt: "desc" },
    include: proposalDetailInclude,
  });
}

export async function getProposalById(proposalId: string, viewer: SalesCrmViewer) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, include: proposalDetailInclude });
  if (!proposal) return null;
  if (!viewer.hasFullAccess && proposal.salesLead.assignedToId !== viewer.teamMemberId) return null;

  return proposal;
}

export type ProposalDetail = NonNullable<Awaited<ReturnType<typeof getProposalById>>>;

/**
 * Paise, or null if this lead has no accepted proposal (or the accepted
 * version's content is missing the package for some reason). Used to
 * pre-fill ConvertToProjectDialog's amount - the admin still re-confirms
 * it, same as every other "suggested value" in this codebase.
 */
export async function getAcceptedProposalPackagePrice(salesLeadId: string): Promise<number | null> {
  const proposal = await prisma.proposal.findFirst({
    where: { salesLeadId, status: "ACCEPTED" },
    orderBy: { respondedAt: "desc" },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  if (!proposal) return null;

  const content = proposal.versions[0]?.content as unknown as
    | { packages: { id: string; priceAmount: number }[]; calculator: { items: { id: string; priceAmount: number }[] } | null }
    | undefined;

  if (proposal.selectedPackageId) {
    return content?.packages.find((p) => p.id === proposal.selectedPackageId)?.priceAmount ?? null;
  }

  if (proposal.selectedCalculatorItemIds.length > 0 && content?.calculator) {
    const items = content.calculator.items.filter((i) => proposal.selectedCalculatorItemIds.includes(i.id));
    return items.length > 0 ? items.reduce((sum, i) => sum + i.priceAmount, 0) : null;
  }

  return null;
}
