"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { convertLeadToProjectSchema, updateProjectStatusSchema } from "../validation/project-schemas";
import { resolveSalesCrmViewer } from "../server/rbac";
import { createNotification } from "@/features/notifications/server/creation";

async function actorTeamMemberId(userId: string): Promise<string | undefined> {
  const teamMember = await prisma.teamMember.findUnique({ where: { userId } });
  return teamMember?.id;
}

export type ConvertToProjectResult = ActionResult & { projectId?: string };

/**
 * Admin-only, per the brief's "If Lead Status changes to Won, Admin can
 * click Convert to Project" - never automatic, always a deliberate click.
 * totalValue is entered fresh at conversion time rather than trusting the
 * lead's estimatedValue, since that was only ever a pre-negotiation guess.
 * A WON lead can hold more than one project (a repeat/expanded engagement
 * with an already-won client) - this action is callable repeatedly on the
 * same lead, each call creating one more named SalesProject.
 */
export async function convertLeadToProject(input: unknown): Promise<ConvertToProjectResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = convertLeadToProjectSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const lead = await prisma.salesLead.findUnique({ where: { id: data.salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (lead.status !== "WON") return { success: false, error: "Only a Won lead can be converted to a project." };

    const actorId = await actorTeamMemberId(user.id);

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.salesProject.create({
        data: {
          salesLeadId: lead.id,
          name: data.name,
          type: data.type,
          priority: data.priority,
          clientName: lead.businessName,
          salesPersonId: lead.assignedToId,
          projectManagerId: data.projectManagerId,
          assignedDeveloperId: data.assignedDeveloperId,
          totalValue: data.totalValue,
          targetEndDate: data.targetEndDate,
          description: data.description,
        },
      });
      await tx.salesLeadActivity.create({
        data: {
          salesLeadId: lead.id,
          type: "PROJECT_CREATED",
          description: `Project created: ${data.name}`,
          performedById: actorId ?? null,
        },
      });
      return created;
    });

    const notifyRecipients = [lead.assignedToId, data.projectManagerId, data.assignedDeveloperId].filter(
      (id): id is string => !!id
    );
    if (notifyRecipients.length > 0) {
      const members = await prisma.teamMember.findMany({
        where: { id: { in: notifyRecipients } },
        select: { userId: true },
      });
      await Promise.allSettled(
        members
          .filter((m) => m.userId)
          .map((m) =>
            createNotification({
              userId: m.userId!,
              type: "SALES_PROJECT_ASSIGNED",
              title: "Project assigned",
              body: `${data.name} (${lead.businessName}) has been created.`,
              link: `/admin/sales-crm/projects/${project.id}`,
            })
          )
      );
    }

    revalidatePath(`/admin/sales-crm/leads/${lead.id}`);
    revalidatePath(`/sales/leads/${lead.id}`);
    revalidatePath("/admin/sales-crm/projects");
    return { success: true, projectId: project.id };
  } catch (error) {
    console.error("convertLeadToProject failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateProjectStatus(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = updateProjectStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const project = await prisma.salesProject.findUnique({ where: { id: data.salesProjectId } });
    if (!project) return { success: false, error: "Project not found." };
    if (!viewer.hasFullAccess && project.salesPersonId !== viewer.teamMemberId) {
      return { success: false, error: "Project not found." };
    }

    await prisma.salesProject.update({ where: { id: data.salesProjectId }, data: { status: data.status } });

    revalidatePath(`/admin/sales-crm/projects/${data.salesProjectId}`);
    revalidatePath(`/sales/projects/${data.salesProjectId}`);
    return { success: true };
  } catch (error) {
    console.error("updateProjectStatus failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
