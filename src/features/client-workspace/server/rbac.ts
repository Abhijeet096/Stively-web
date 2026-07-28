import "server-only";

import { prisma } from "@/lib/prisma";

export interface ClientWorkspaceViewer {
  userId: string;
  /** Every SalesLead this CLIENT-role user is linked to as the business's contact - see SalesLead.clientUserId. Usually one; a repeat client can have more. */
  salesLeadIds: string[];
}

/**
 * The CLIENT-side counterpart to resolveSalesCrmViewer
 * (src/features/sales-crm/server/rbac.ts) - there's no "full access" tier
 * here, a client only ever sees what's linked to their own account. An
 * unlinked/not-yet-invited CLIENT user gets an empty salesLeadIds array,
 * which every scoped query below turns into a real zero-row result rather
 * than a leak.
 */
export async function resolveClientWorkspaceViewer(userId: string): Promise<ClientWorkspaceViewer> {
  const leads = await prisma.salesLead.findMany({ where: { clientUserId: userId }, select: { id: true } });
  return { userId, salesLeadIds: leads.map((l) => l.id) };
}
