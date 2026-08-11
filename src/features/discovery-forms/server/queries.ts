import "server-only";

import { prisma } from "@/lib/prisma";
import type { SalesCrmViewer } from "@/features/sales-crm/server/rbac";
import type { ClientWorkspaceViewer } from "@/features/client-workspace/server/rbac";

/** Every discovery form ever sent for one lead, newest first - the admin lead-detail page's Discovery Forms panel. Ownership-scoped the same way every other sales-crm-adjacent query is. */
export async function getDiscoveryFormsForLead(salesLeadId: string, viewer: SalesCrmViewer) {
  const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId }, select: { assignedToId: true } });
  if (!lead) return [];
  if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) return [];

  return prisma.discoveryForm.findMany({
    where: { salesLeadId },
    orderBy: { createdAt: "desc" },
    include: { sentBy: { select: { name: true } }, reviewedBy: { select: { name: true } } },
  });
}

export async function getDiscoveryFormById(id: string, viewer: SalesCrmViewer) {
  const form = await prisma.discoveryForm.findUnique({
    where: { id },
    include: { salesLead: { select: { id: true, businessName: true, assignedToId: true } } },
  });
  if (!form) return null;
  if (!viewer.hasFullAccess && form.salesLead.assignedToId !== viewer.teamMemberId) return null;
  return form;
}

/**
 * Client-side - every discovery form sent for a lead this CLIENT user owns,
 * newest first. Scoped via ClientWorkspaceViewer.salesLeadIds exactly like
 * every other client-workspace query - a client can never fetch another
 * client's forms even by guessing a salesLeadId.
 */
export async function getDiscoveryFormsForClient(salesLeadId: string, viewer: ClientWorkspaceViewer) {
  if (!viewer.salesLeadIds.includes(salesLeadId)) return [];
  return prisma.discoveryForm.findMany({
    where: { salesLeadId },
    orderBy: { createdAt: "desc" },
  });
}
