"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { createTaskSchema, updateTaskStatusSchema } from "../validation/follow-up-task-schemas";
import { resolveSalesCrmViewer } from "../server/rbac";

async function actorTeamMemberId(userId: string): Promise<string | undefined> {
  const teamMember = await prisma.teamMember.findUnique({ where: { userId } });
  return teamMember?.id;
}

export async function createTask(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    if (data.salesLeadId) {
      const viewer = await resolveSalesCrmViewer(user.id, user.role);
      const lead = await prisma.salesLead.findUnique({ where: { id: data.salesLeadId } });
      if (!lead) return { success: false, error: "Lead not found." };
      if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
        return { success: false, error: "Lead not found." };
      }
    }

    const actorId = await actorTeamMemberId(user.id);
    await prisma.salesTask.create({
      data: {
        title: data.title,
        description: data.description,
        salesLeadId: data.salesLeadId,
        assignedToId: data.assignedToId,
        assignedById: actorId,
        priority: data.priority,
        dueDate: data.dueDate,
      },
    });

    revalidatePath("/admin/sales-crm/tasks");
    if (data.salesLeadId) revalidatePath(`/admin/sales-crm/leads/${data.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("createTask failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateTaskStatus(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = updateTaskStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const task = await prisma.salesTask.findUnique({ where: { id: data.taskId } });
    if (!task) return { success: false, error: "Task not found." };
    if (!viewer.hasFullAccess && task.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Task not found." };
    }

    await prisma.salesTask.update({
      where: { id: data.taskId },
      data: { status: data.status, completedAt: data.status === "DONE" ? new Date() : null },
    });

    revalidatePath("/admin/sales-crm/tasks");
    if (task.salesLeadId) revalidatePath(`/admin/sales-crm/leads/${task.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("updateTaskStatus failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
