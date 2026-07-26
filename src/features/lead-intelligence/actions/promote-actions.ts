"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { mapBusinessDataSourceToSalesLeadSource } from "../lib/map-business-source";
import { writeAuditLog } from "../server/audit";
import { buildAssignmentOps } from "@/features/sales-crm/server/creation";
import { createNotification } from "@/features/notifications/server/creation";

async function resolveActorId(userId: string): Promise<string | undefined> {
  const linked = await prisma.teamMember.findUnique({ where: { userId } });
  return linked?.id;
}

export type PromoteToSalesLeadResult = ActionResult & { salesLeadId?: string };

/**
 * Hands a discovered Business off into the real outbound sales pipeline -
 * the one integration point between this feature and the existing Sales
 * CRM. Duplicate-promotion is structurally impossible:
 * Business.promotedSalesLeadId is @unique at the DB level, and this action
 * checks it first for a clean user-facing error rather than a raw
 * constraint-violation surfacing to the UI.
 *
 * `assigneeId` is optional - promoting without one leaves the lead
 * Unassigned (same as creating a lead directly in the Sales CRM with no
 * assignee), matching today's behavior. When provided, this reuses the
 * exact same assignment machinery as reassignSalesLead
 * (buildAssignmentOps + a real SALES_LEAD_ASSIGNED notification to the
 * assignee) so a business can go from "discovered" to "in a real
 * salesperson's queue" in one action instead of a separate reassign step.
 */
export async function promoteToSalesLead(businessId: string, assigneeId?: string): Promise<PromoteToSalesLeadResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return { success: false, error: "Business not found." };
  if (business.promotedSalesLeadId) {
    return { success: false, error: "This business has already been promoted to a Sales Lead." };
  }
  if (!business.phone) {
    return { success: false, error: "A phone number is required before promoting - add one to this business first." };
  }

  try {
    const actorId = await resolveActorId(user.id);

    const salesLead = await prisma.$transaction(async (tx) => {
      const lead = await tx.salesLead.create({
        data: {
          businessName: business.businessName,
          ownerName: business.ownerName ?? "Unknown",
          industry: business.industry,
          phone: business.phone!,
          whatsapp: business.whatsapp,
          email: business.email,
          website: business.website,
          address: business.address,
          city: business.city,
          state: business.state,
          country: business.country,
          source: mapBusinessDataSourceToSalesLeadSource(business.dataSource),
          status: "NEW",
          priority: "MEDIUM",
          assignedToId: assigneeId,
          createdById: actorId,
        },
      });

      await tx.business.update({
        where: { id: business.id },
        data: { promotedSalesLeadId: lead.id, promotedAt: new Date(), promotedById: actorId, status: "PROMOTED" },
      });

      await tx.businessActivity.create({
        data: { businessId: business.id, type: "PROMOTED_TO_SALES_LEAD", description: `Promoted to Sales Lead ${lead.id}`, performedById: actorId ?? null },
      });
      await tx.salesLeadActivity.create({
        data: { salesLeadId: lead.id, type: "LEAD_CREATED", description: "Created from AI Lead Intelligence", performedById: actorId ?? null },
      });

      if (assigneeId) {
        await Promise.all(
          buildAssignmentOps(tx, {
            salesLeadId: lead.id,
            assigneeId,
            assignedById: actorId ?? null,
            reason: "INITIAL",
            activityType: "LEAD_ASSIGNED",
            activityDescription: "Assigned on promotion from Lead Intelligence",
          })
        );
      }

      return lead;
    });

    if (assigneeId) {
      const assignee = await prisma.teamMember.findUnique({ where: { id: assigneeId }, select: { userId: true } });
      if (assignee?.userId) {
        try {
          await createNotification({
            userId: assignee.userId,
            type: "SALES_LEAD_ASSIGNED",
            title: "New lead assigned",
            body: `${salesLead.businessName} has been assigned to you.`,
            link: `/admin/sales-crm/leads/${salesLead.id}`,
          });
        } catch (error) {
          console.error("promoteToSalesLead notification failed:", error);
        }
      }
    }

    await writeAuditLog({
      actorId: actorId ?? null,
      action: "lead_intelligence.business_promoted",
      entityType: "Business",
      entityId: business.id,
      metadata: { salesLeadId: salesLead.id, assigneeId: assigneeId ?? null },
    });

    revalidatePath("/admin/lead-intelligence/businesses");
    revalidatePath(`/admin/lead-intelligence/businesses/${businessId}`);
    revalidatePath("/admin/sales-crm/leads");

    return { success: true, salesLeadId: salesLead.id };
  } catch (error) {
    console.error("promoteToSalesLead failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
