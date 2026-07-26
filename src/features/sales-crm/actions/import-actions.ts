"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { importSalesLeadsSchema } from "../validation/import-schema";
import { getDefaultSalesOwner } from "../server/queries";
import { buildAssignmentOps } from "../server/creation";
import { createNotification } from "@/features/notifications/server/creation";

async function resolveActorId(userId: string): Promise<string | undefined> {
  const linked = await prisma.teamMember.findUnique({ where: { userId } });
  if (linked) return linked.id;
  const founder = await getDefaultSalesOwner();
  return founder?.id;
}

export type ImportSalesLeadsResult = ActionResult & {
  created?: number;
  skippedDuplicates?: number;
  rowErrors?: { row: number; message: string }[];
};

/**
 * Admin-only, per the brief's "Admin can Import Leads". Column mapping and
 * source/priority normalization already happened client-side (see
 * import-column-mapping.ts) - this action receives fully-shaped rows and
 * is only responsible for validating, deduping (against both the DB and
 * other rows in the same file, by phone number), and inserting. Never
 * overwrites an existing lead that shares a phone number - it's reported
 * as a skipped duplicate instead, so a re-import of an updated sheet never
 * silently clobbers real CRM data (notes, activity, assignment history)
 * already built up on that lead.
 */
export async function importSalesLeads(input: unknown): Promise<ImportSalesLeadsResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = importSalesLeadsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { rows, assigneeId } = parsed.data;

  const actorId = await resolveActorId(user.id);
  const seenPhones = new Set<string>();
  const rowErrors: { row: number; message: string }[] = [];
  let created = 0;
  let skippedDuplicates = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const phoneKey = row.phone.replace(/\D/g, "");
    if (!phoneKey) {
      rowErrors.push({ row: i + 1, message: "Missing a usable phone number" });
      continue;
    }
    if (seenPhones.has(phoneKey)) {
      skippedDuplicates++;
      continue;
    }
    seenPhones.add(phoneKey);

    try {
      const existing = await prisma.salesLead.findFirst({ where: { phone: row.phone } });
      if (existing) {
        skippedDuplicates++;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        const lead = await tx.salesLead.create({
          data: {
            businessName: row.businessName,
            ownerName: row.ownerName,
            phone: row.phone,
            whatsapp: row.whatsapp || undefined,
            email: row.email || undefined,
            website: row.website || undefined,
            industry: row.industry || undefined,
            address: row.address || undefined,
            city: row.city || undefined,
            state: row.state || undefined,
            country: row.country || "India",
            gstNumber: row.gstNumber || undefined,
            source: row.source,
            priority: row.priority,
            estimatedValue: row.estimatedValue,
            assignedToId: assigneeId,
            createdById: actorId,
          },
        });
        await tx.salesLeadActivity.create({
          data: { salesLeadId: lead.id, type: "LEAD_CREATED", description: "Imported from CSV", performedById: actorId ?? null },
        });
        if (row.notes) {
          await tx.salesLeadNote.create({ data: { salesLeadId: lead.id, content: row.notes, authorId: actorId } });
        }
        if (assigneeId) {
          await Promise.all(
            buildAssignmentOps(tx, {
              salesLeadId: lead.id,
              assigneeId,
              assignedById: actorId ?? null,
              reason: "INITIAL",
              activityType: "LEAD_ASSIGNED",
              activityDescription: "Assigned on import",
            })
          );
        }
      });
      created++;
    } catch (error) {
      console.error("importSalesLeads row failed:", error);
      rowErrors.push({ row: i + 1, message: "Something went wrong saving this row" });
    }
  }

  // One consolidated notification, not one per lead - a 200-row import shouldn't flood a salesperson's notification list.
  if (assigneeId && created > 0) {
    const assignee = await prisma.teamMember.findUnique({ where: { id: assigneeId }, select: { userId: true } });
    if (assignee?.userId) {
      try {
        await createNotification({
          userId: assignee.userId,
          type: "SALES_LEAD_ASSIGNED",
          title: "New leads assigned",
          body: `${created} lead${created === 1 ? "" : "s"} imported and assigned to you.`,
          link: "/admin/sales-crm/leads",
        });
      } catch (error) {
        console.error("importSalesLeads notification failed:", error);
      }
    }
  }

  revalidatePath("/admin/sales-crm/leads");
  return { success: true, created, skippedDuplicates, rowErrors };
}
