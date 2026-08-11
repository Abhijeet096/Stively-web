import "server-only";

import { prisma } from "@/lib/prisma";
import type { SalesLead } from "@prisma/client";

export type ClientInviteResolution =
  | { status: "valid"; salesLead: SalesLead }
  | { status: "not_found" }
  | { status: "expired" }
  | { status: "already_used" };

/**
 * The one function the public /invite/[token] route resolves through - same
 * closed-union shape as resolveProposalToken/resolveDiscoveryFormToken, so
 * the page renders a specific, honest message instead of a generic 404.
 * "already_used" covers both a token that was already accepted (clientUserId
 * now set) and the token field being null (already cleared on acceptance) -
 * this lookup is by token value, so a cleared token simply won't match
 * anything and falls into not_found instead; already_used is reachable if
 * someone re-opens a tab after accepting in another one before this page
 * re-fetches.
 */
export async function resolveClientInviteToken(token: string): Promise<ClientInviteResolution> {
  const salesLead = await prisma.salesLead.findUnique({ where: { inviteToken: token } });
  if (!salesLead) return { status: "not_found" };
  if (salesLead.clientUserId) return { status: "already_used" };
  if (salesLead.inviteTokenExpiresAt && salesLead.inviteTokenExpiresAt < new Date()) {
    return { status: "expired" };
  }
  return { status: "valid", salesLead };
}

/** First-open tracking, same "write on read, never regress" precedent as recordDiscoveryFormOpen. */
export async function recordClientInviteOpen(salesLeadId: string): Promise<void> {
  const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId }, select: { inviteOpenedAt: true } });
  if (!lead || lead.inviteOpenedAt) return;
  await prisma.salesLead.update({ where: { id: salesLeadId }, data: { inviteOpenedAt: new Date() } });
}
