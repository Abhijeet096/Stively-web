"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { updateSalesLeadDiscoverySchema } from "../validation/discovery-schemas";

async function resolveActorId(userId: string): Promise<string | undefined> {
  const linked = await prisma.teamMember.findUnique({ where: { userId } });
  return linked?.id;
}

/**
 * Upserts the discovery readiness checklist for a lead - a mutable working
 * draft (see SalesLeadDiscovery's schema comment), so this always writes
 * the whole form, not a partial patch. Any ADMIN/SUPER_ADMIN/SALES viewer
 * who can already see this lead (via resolveSalesCrmViewer's existing
 * full-vs-own-only scoping) can edit its discovery notes.
 */
export async function updateSalesLeadDiscovery(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = updateSalesLeadDiscoverySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: data.salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    const actorId = await resolveActorId(user.id);
    const { salesLeadId, ...fields } = data;

    await prisma.salesLeadDiscovery.upsert({
      where: { salesLeadId },
      create: { salesLeadId, ...fields, updatedById: actorId ?? null },
      update: { ...fields, updatedById: actorId ?? null },
    });

    revalidatePath(`/admin/sales-crm/leads/${salesLeadId}`);
    revalidatePath(`/sales/leads/${salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("updateSalesLeadDiscovery failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
