import "server-only";

import type { SalesLeadDiscovery } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getSalesLeadDiscovery(salesLeadId: string): Promise<SalesLeadDiscovery | null> {
  return prisma.salesLeadDiscovery.findUnique({ where: { salesLeadId } });
}

// Re-exported for existing server-side importers - the actual
// implementation lives in ../lib/readiness.ts (no "server-only", pure/
// zero-I/O) so client components can import it directly without pulling
// in this file's Prisma access.
export { computeProposalReadiness, type ProposalReadiness } from "../lib/readiness";
