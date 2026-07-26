import "server-only";

import { prisma } from "@/lib/prisma";
import type { Proposal, ProposalVersion, ProposalComment, SalesLead } from "@prisma/client";

export type ResolvedProposal = Proposal & {
  salesLead: SalesLead;
  versions: ProposalVersion[];
  comments: ProposalComment[];
};

export type ProposalResolution =
  | { status: "valid"; proposal: ResolvedProposal }
  | { status: "not_found" }
  | { status: "expired" };

/**
 * The one function the public /proposal/[token] route and every
 * client-facing action resolve through - same closed-union shape as
 * interviews' resolveInterviewLink, so the page can render a specific,
 * honest message instead of a generic 404. Lazily flips status to EXPIRED
 * on the first read past expiresAt, same write-on-read precedent as
 * InterviewLink.
 */
export async function resolveProposalToken(token: string): Promise<ProposalResolution> {
  const proposal = await prisma.proposal.findUnique({
    where: { token },
    include: {
      salesLead: true,
      versions: { orderBy: { versionNumber: "desc" } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!proposal) return { status: "not_found" };

  if (proposal.expiresAt && proposal.expiresAt < new Date() && proposal.status !== "ACCEPTED" && proposal.status !== "REJECTED") {
    if (proposal.status !== "EXPIRED") {
      await prisma.proposal.update({ where: { id: proposal.id }, data: { status: "EXPIRED" } });
    }
    return { status: "expired" };
  }

  return { status: "valid", proposal };
}

/**
 * Fire-and-observe: the page renders regardless of whether this succeeds.
 * Only the first view writes a SalesLeadActivity + notifies the
 * salesperson (see actions/proposal-actions.ts's callers) - every
 * subsequent view just increments the counters, so re-opening the link a
 * dozen times doesn't flood the CRM timeline. Never regresses a status
 * that has already progressed past VIEWED (e.g. COMMENTED/ACCEPTED).
 */
export async function recordProposalView(proposalId: string): Promise<{ isFirstView: boolean }> {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, select: { firstViewedAt: true, status: true } });
  if (!proposal) return { isFirstView: false };

  const isFirstView = !proposal.firstViewedAt;
  const now = new Date();

  const PRE_VIEW_STATUSES = ["DRAFT", "INTERNAL_REVIEW", "SENT"];

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      viewCount: { increment: 1 },
      firstViewedAt: proposal.firstViewedAt ?? now,
      lastViewedAt: now,
      status: PRE_VIEW_STATUSES.includes(proposal.status) ? "VIEWED" : undefined,
    },
  });

  return { isFirstView };
}

const RATE_LIMIT_WINDOW_MS = 60_000;
// A real client reading a proposal and leaving a couple of comments/one
// decision is nowhere close to this - it exists purely to blunt a leaked
// link being hammered against the notification/activity-writing actions.
const RATE_LIMIT_MAX_PER_WINDOW = 10;

/**
 * Fixed-window rate limit for the public, token-authenticated client
 * actions (comment/accept/reject/request-changes) - identical DB-backed
 * pattern to interviews/server/rate-limit.ts, necessary since this app
 * runs across stateless serverless instances.
 */
export async function checkProposalRateLimit(proposalId: string): Promise<boolean> {
  const now = new Date();
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { rateLimitWindowStart: true, rateLimitCount: true },
  });
  if (!proposal) return false;

  const windowActive = proposal.rateLimitWindowStart && now.getTime() - proposal.rateLimitWindowStart.getTime() < RATE_LIMIT_WINDOW_MS;

  if (!windowActive) {
    await prisma.proposal.update({ where: { id: proposalId }, data: { rateLimitWindowStart: now, rateLimitCount: 1 } });
    return true;
  }

  if (proposal.rateLimitCount >= RATE_LIMIT_MAX_PER_WINDOW) return false;

  await prisma.proposal.update({ where: { id: proposalId }, data: { rateLimitCount: { increment: 1 } } });
  return true;
}
