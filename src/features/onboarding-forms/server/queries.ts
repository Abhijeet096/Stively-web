import "server-only";

import { prisma } from "@/lib/prisma";
import type { SalesCrmViewer } from "@/features/sales-crm/server/rbac";
import type { ClientWorkspaceViewer } from "@/features/client-workspace/server/rbac";

/** Ownership check for a project-scoped action/query - same salesPersonId scoping SalesProject's own payment/progress actions already use (assertProjectAccess in sales-crm/actions/payment-actions.ts), not SalesLead.assignedToId. */
async function canAccessProject(salesProjectId: string, viewer: SalesCrmViewer): Promise<boolean> {
  if (viewer.hasFullAccess) return true;
  const project = await prisma.salesProject.findUnique({ where: { id: salesProjectId }, select: { salesPersonId: true } });
  return !!project && project.salesPersonId === viewer.teamMemberId;
}

/** Every onboarding form ever sent for one project, newest first - the admin project-detail page's Onboarding Forms panel. */
export async function getOnboardingFormsForProject(salesProjectId: string, viewer: SalesCrmViewer) {
  if (!(await canAccessProject(salesProjectId, viewer))) return [];

  return prisma.onboardingForm.findMany({
    where: { salesProjectId },
    orderBy: { createdAt: "desc" },
    include: { sentBy: { select: { name: true } }, reviewedBy: { select: { name: true } } },
  });
}

export async function getOnboardingFormById(id: string, viewer: SalesCrmViewer) {
  const form = await prisma.onboardingForm.findUnique({
    where: { id },
    include: {
      salesProject: { select: { id: true, name: true, clientName: true, salesPersonId: true } },
      uploads: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!form) return null;
  if (!viewer.hasFullAccess && form.salesProject.salesPersonId !== viewer.teamMemberId) return null;
  return form;
}

/**
 * Client-side - every onboarding form sent for a project this CLIENT owns,
 * newest first. Scoped two ways: the project must belong to a SalesLead the
 * viewer owns (ClientWorkspaceViewer.salesLeadIds), same double-check
 * pattern as getClientProjectById.
 */
export async function getOnboardingFormsForClientProject(salesProjectId: string, viewer: ClientWorkspaceViewer) {
  const project = await prisma.salesProject.findUnique({ where: { id: salesProjectId }, select: { salesLeadId: true } });
  if (!project || !viewer.salesLeadIds.includes(project.salesLeadId)) return [];

  return prisma.onboardingForm.findMany({
    where: { salesProjectId },
    orderBy: { createdAt: "desc" },
    include: { uploads: { orderBy: { createdAt: "asc" } } },
  });
}
