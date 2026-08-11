import "server-only";

import type { Lead, Prisma, TeamMember } from "@prisma/client";

import { mapLeadSourceToSalesLeadSource } from "../lib/map-lead-source";

export class QualifyLeadError extends Error {}

export interface QualifyResult {
  salesLeadId: string;
  linkedExisting: boolean;
}

/**
 * The Lead -> SalesLead qualification bridge - same shape as
 * promoteToSalesLead (Business) and the OfferingRequest bridge (see AD-001),
 * called from updateLead (src/actions/crm.ts) the moment an admin sets a
 * BUSINESS-leadType Lead's status to CONVERTED (labelled "Qualified" in the
 * B2B admin UI). Runs INSIDE updateLead's existing transaction so the status
 * change and the SalesLead link/create either both happen or neither does -
 * a Lead should never end up CONVERTED without a linked client record.
 *
 * Dedupe: if an existing SalesLead already matches this lead's email or
 * phone, links to it instead of creating a duplicate (per the brief's "if
 * the same email already belongs to a client, detect the existing client
 * and offer to link the lead rather than creating a duplicate" - simplified
 * to an automatic link rather than a confirmation dialog, since a
 * email/phone match is unambiguous and this is a low-volume, pre-first-
 * client flow; revisit if that judgment call ever proves wrong).
 */
export async function qualifyBusinessLeadTx(
  tx: Prisma.TransactionClient,
  lead: Lead,
  actorId: string | undefined
): Promise<QualifyResult> {
  if (lead.leadType !== "BUSINESS") {
    throw new QualifyLeadError("Only a Business lead can be qualified into the Sales CRM.");
  }
  if (lead.promotedSalesLeadId) {
    throw new QualifyLeadError("This lead has already been qualified.");
  }
  if (!lead.phone) {
    throw new QualifyLeadError("Add a phone number before qualifying this lead - the Sales CRM requires one.");
  }

  const existing = await tx.salesLead.findFirst({
    where: {
      OR: [...(lead.email ? [{ email: lead.email }] : []), { phone: lead.phone }],
    },
  });

  let salesLeadId: string;
  let linkedExisting: boolean;

  if (existing) {
    salesLeadId = existing.id;
    linkedExisting = true;
    await tx.salesLeadActivity.create({
      data: {
        salesLeadId: existing.id,
        type: "NOTE_ADDED",
        description: `Linked to inbound Lead "${lead.name}" (matched by ${lead.email && lead.email === existing.email ? "email" : "phone"}) - no duplicate created.`,
        performedById: actorId ?? null,
      },
    });
  } else {
    const created = await tx.salesLead.create({
      data: {
        businessName: lead.companyName || lead.name,
        ownerName: lead.name,
        phone: lead.phone,
        email: lead.email,
        source: mapLeadSourceToSalesLeadSource(lead.source),
        status: "NEW",
        priority: lead.priority,
        estimatedValue: lead.estimatedValue,
        assignedToId: lead.currentOwnerId,
        createdById: actorId,
      },
    });
    salesLeadId = created.id;
    linkedExisting = false;
    await tx.salesLeadActivity.create({
      data: {
        salesLeadId: created.id,
        type: "LEAD_CREATED",
        description: `Qualified from inbound Lead "${lead.name}"`,
        performedById: actorId ?? null,
      },
    });
  }

  await tx.lead.update({
    where: { id: lead.id },
    data: { promotedSalesLeadId: salesLeadId, promotedAt: new Date(), promotedById: actorId },
  });

  return { salesLeadId, linkedExisting };
}

/** Resolves the notification recipient for a newly-qualified lead's assignee, if any - mirrors promoteToSalesLead's identical lookup. */
export async function resolveAssigneeUserId(
  tx: Prisma.TransactionClient,
  assignedToId: string | null
): Promise<string | null> {
  if (!assignedToId) return null;
  const member: Pick<TeamMember, "userId"> | null = await tx.teamMember.findUnique({
    where: { id: assignedToId },
    select: { userId: true },
  });
  return member?.userId ?? null;
}
