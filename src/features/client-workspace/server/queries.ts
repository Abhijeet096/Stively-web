import "server-only";

import { prisma } from "@/lib/prisma";
import type { SalesCrmViewer } from "@/features/sales-crm/server/rbac";
import type { ClientWorkspaceViewer } from "./rbac";

/** Same lazy PENDING -> DUE promotion as sales-crm's own promoteDuePayments (server/queries.ts), scoped to whichever leads the viewer owns instead of a single project. */
async function promoteDuePaymentsForLeads(salesLeadIds: string[]): Promise<void> {
  if (salesLeadIds.length === 0) return;
  await prisma.salesProjectPayment.updateMany({
    where: { status: "PENDING", dueDate: { lt: new Date() }, salesProject: { salesLeadId: { in: salesLeadIds } } },
    data: { status: "DUE" },
  });
}

/** Staff-side (admin/sales lead detail) - same ownership gate as every other SalesLead-scoped query in sales-crm. */
export async function getClientDocumentsForLead(salesLeadId: string, viewer: SalesCrmViewer) {
  const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId }, select: { assignedToId: true } });
  if (!lead) return [];
  if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) return [];

  return prisma.clientDocument.findMany({
    where: { salesLeadId },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });
}

/** Client-side - every business this CLIENT user is linked to, most recent first, for the /client/projects list. */
export async function getClientWorkspaces(viewer: ClientWorkspaceViewer) {
  if (viewer.salesLeadIds.length === 0) return [];
  return prisma.salesLead.findMany({
    where: { id: { in: viewer.salesLeadIds } },
    orderBy: { createdAt: "desc" },
    include: { project: true },
  });
}

/** Client-side - one business's full workspace (documents, and the project once one exists). Returns null both when it doesn't exist and when it isn't this client's - same "not found and not yours look identical" precedent used throughout this codebase. */
export async function getClientWorkspaceById(salesLeadId: string, viewer: ClientWorkspaceViewer) {
  if (!viewer.salesLeadIds.includes(salesLeadId)) return null;

  await promoteDuePaymentsForLeads([salesLeadId]);

  return prisma.salesLead.findUnique({
    where: { id: salesLeadId },
    include: {
      project: {
        include: {
          payments: { orderBy: { createdAt: "asc" } },
          updates: { orderBy: { createdAt: "desc" } },
          milestones: { orderBy: { order: "asc" } },
        },
      },
      // Excludes ARCHIVED - a regenerated document (see ARCHITECTURE_DECISIONS.md's
      // versioning entry) leaves its old row in place for audit history, but a
      // client should only ever see the current version, never a superseded one.
      documents: { where: { lifecycleStatus: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" } },
      quotes: { orderBy: { sentAt: "desc" }, include: { offering: { select: { title: true } }, createdBy: { select: { name: true } } } },
      meetings: { orderBy: { scheduledAt: "desc" } },
      messages: { orderBy: { createdAt: "asc" } },
      assignedTo: { select: { name: true } },
    },
  });
}

/** Client-side - every payment across every linked business, most recent first, for the /client/invoices list. */
export async function getClientPayments(viewer: ClientWorkspaceViewer) {
  if (viewer.salesLeadIds.length === 0) return [];
  await promoteDuePaymentsForLeads(viewer.salesLeadIds);
  return prisma.salesProjectPayment.findMany({
    where: { salesProject: { salesLeadId: { in: viewer.salesLeadIds } } },
    orderBy: { createdAt: "desc" },
    include: {
      salesProject: { select: { clientName: true, salesLeadId: true } },
      // Same ARCHIVED exclusion as getClientWorkspaceById above.
      documents: { where: { lifecycleStatus: { not: "ARCHIVED" } } },
    },
  });
}

/** Client-side dashboard aggregate - real cross-project rollups, no fabricated numbers. Every field is a direct DB read scoped to this viewer's own leads. */
export async function getClientDashboardSummary(viewer: ClientWorkspaceViewer) {
  if (viewer.salesLeadIds.length === 0) {
    return { upcomingPayments: [], latestUpdate: null, currentMilestone: null };
  }
  await promoteDuePaymentsForLeads(viewer.salesLeadIds);

  const [upcomingPayments, latestUpdate, currentMilestone] = await Promise.all([
    prisma.salesProjectPayment.findMany({
      where: { status: { in: ["PENDING", "DUE"] }, salesProject: { salesLeadId: { in: viewer.salesLeadIds } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      include: { salesProject: { select: { clientName: true, salesLeadId: true } } },
    }),
    prisma.projectUpdate.findFirst({
      where: { salesProject: { salesLeadId: { in: viewer.salesLeadIds } } },
      orderBy: { createdAt: "desc" },
      include: { salesProject: { select: { clientName: true, salesLeadId: true } } },
    }),
    prisma.projectMilestone.findFirst({
      where: { status: "IN_PROGRESS", salesProject: { salesLeadId: { in: viewer.salesLeadIds } } },
      orderBy: { updatedAt: "desc" },
      include: { salesProject: { select: { clientName: true, salesLeadId: true } } },
    }),
  ]);

  return { upcomingPayments, latestUpdate, currentMilestone };
}
