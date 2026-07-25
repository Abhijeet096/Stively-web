"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { createSalesLeadSchema, updateSalesLeadSchema, reassignSalesLeadSchema, addSalesLeadNoteSchema } from "../validation/sales-lead-schemas";
import { getDefaultSalesOwner } from "../server/queries";
import { buildAssignmentOps, logSalesLeadActivity } from "../server/creation";
import { resolveSalesCrmViewer } from "../server/rbac";
import { createNotification } from "@/features/notifications/server/creation";

export type CreateSalesLeadResult = ActionResult & { id?: string };

/**
 * Resolves "who is performing this action" from the signed-in session -
 * same pattern as src/actions/crm.ts's resolveActorId() for the Lead CRM.
 * Every Sales CRM action is gated by requireRole first, so a session is
 * always present here.
 */
async function resolveSalesActorId(userId: string): Promise<string | undefined> {
  const linked = await prisma.teamMember.findUnique({ where: { userId } });
  if (linked) return linked.id;
  const founder = await getDefaultSalesOwner();
  return founder?.id;
}

/** Admin-only, per the brief's "Admin can Create Leads". */
export async function createSalesLead(input: unknown): Promise<CreateSalesLeadResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = createSalesLeadSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const actorId = await resolveSalesActorId(user.id);
    const assigneeId = data.assignedToId ?? actorId ?? (await getDefaultSalesOwner())?.id;

    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.salesLead.create({
        data: {
          businessName: data.businessName,
          ownerName: data.ownerName,
          industry: data.industry,
          phone: data.phone,
          whatsapp: data.whatsapp,
          email: data.email || null,
          website: data.website,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          gstNumber: data.gstNumber,
          source: data.source,
          priority: data.priority,
          estimatedValue: data.estimatedValue,
          assignedToId: assigneeId,
          createdById: actorId,
        },
      });

      await tx.salesLeadActivity.create({
        data: { salesLeadId: created.id, type: "LEAD_CREATED", performedById: actorId ?? null },
      });

      if (assigneeId) {
        await Promise.all(
          buildAssignmentOps(tx, {
            salesLeadId: created.id,
            assigneeId,
            assignedById: actorId ?? null,
            reason: "INITIAL",
            activityType: "LEAD_ASSIGNED",
            activityDescription: "Assigned on creation",
          })
        );
      }

      return created;
    });

    if (assigneeId) {
      const assignee = await prisma.teamMember.findUnique({ where: { id: assigneeId }, select: { userId: true } });
      if (assignee?.userId) {
        try {
          await createNotification({
            userId: assignee.userId,
            type: "SALES_LEAD_ASSIGNED",
            title: "New lead assigned",
            body: `${lead.businessName} has been assigned to you.`,
            link: `/admin/sales-crm/leads/${lead.id}`,
          });
        } catch (error) {
          console.error("createSalesLead notification failed:", error);
        }
      }
    }

    revalidatePath("/admin/sales-crm/leads");
    return { success: true, id: lead.id };
  } catch (error) {
    console.error("createSalesLead failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Any Sales CRM staff can update a lead they can see (admins/managers: any; salespeople: only their own, enforced via resolveSalesCrmViewer). */
export async function updateSalesLead(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = updateSalesLeadSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const existing = await prisma.salesLead.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && existing.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    const actorId = await resolveSalesActorId(user.id);

    await prisma.$transaction(async (tx) => {
      await tx.salesLead.update({
        where: { id },
        data: {
          ...data,
          email: data.email === "" ? null : data.email,
        },
      });

      if (data.status && data.status !== existing.status) {
        await tx.salesLeadActivity.create({
          data: {
            salesLeadId: id,
            type: "STATUS_CHANGED",
            description: `${existing.status} → ${data.status}`,
            metadata: { fromStatus: existing.status, toStatus: data.status },
            performedById: actorId ?? null,
          },
        });
      }
    });

    revalidatePath(`/admin/sales-crm/leads/${id}`);
    revalidatePath("/admin/sales-crm/leads");
    return { success: true };
  } catch (error) {
    console.error("updateSalesLead failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Admin-only, per the brief's "Admin can Assign/Transfer Leads". */
export async function reassignSalesLead(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = reassignSalesLeadSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const actorId = await resolveSalesActorId(user.id);
    const lead = await prisma.salesLead.findUnique({ where: { id: data.salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };

    await prisma.$transaction(async (tx) => {
      await tx.salesLeadAssignment.updateMany({
        where: { salesLeadId: data.salesLeadId, isActive: true },
        data: { isActive: false },
      });
      await tx.salesLead.update({ where: { id: data.salesLeadId }, data: { assignedToId: data.assigneeId } });
      await Promise.all(
        buildAssignmentOps(tx, {
          salesLeadId: data.salesLeadId,
          assigneeId: data.assigneeId,
          assignedById: actorId ?? null,
          reason: data.reason,
          activityType: "LEAD_REASSIGNED",
          activityDescription: "Reassigned",
        })
      );
    });

    const assignee = await prisma.teamMember.findUnique({ where: { id: data.assigneeId }, select: { userId: true } });
    if (assignee?.userId) {
      try {
        await createNotification({
          userId: assignee.userId,
          type: "SALES_LEAD_ASSIGNED",
          title: "Lead assigned to you",
          body: `${lead.businessName} has been assigned to you.`,
          link: `/admin/sales-crm/leads/${lead.id}`,
        });
      } catch (error) {
        console.error("reassignSalesLead notification failed:", error);
      }
    }

    revalidatePath(`/admin/sales-crm/leads/${data.salesLeadId}`);
    revalidatePath("/admin/sales-crm/leads");
    return { success: true };
  } catch (error) {
    console.error("reassignSalesLead failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function addSalesLeadNote(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = addSalesLeadNoteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: data.salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    const actorId = await resolveSalesActorId(user.id);
    await prisma.salesLeadNote.create({
      data: { salesLeadId: data.salesLeadId, content: data.content, authorId: actorId },
    });
    await logSalesLeadActivity({
      salesLeadId: data.salesLeadId,
      type: "NOTE_ADDED",
      performedById: actorId,
    });

    revalidatePath(`/admin/sales-crm/leads/${data.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("addSalesLeadNote failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
