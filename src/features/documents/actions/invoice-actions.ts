"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { generateDocument } from "../server/generate";

/**
 * Admin-facing entry point for the one document type in this pass that's
 * genuinely admin-authored (line items typed in at generation time - see
 * ARCHITECTURE_DECISIONS.md AD-004), unlike Receipt which is always
 * system-triggered off a payment (see server/receipt-trigger.ts). Ownership
 * check mirrors sales-crm/actions/payment-actions.ts's assertProjectAccess
 * exactly - a SALES rep can only invoice their own assigned projects.
 */
export async function generateInvoice(
  salesProjectId: string,
  paymentId: string | undefined,
  input: unknown
): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const project = await prisma.salesProject.findUnique({ where: { id: salesProjectId } });
    if (!project) return { success: false, error: "Project not found." };
    if (!viewer.hasFullAccess && project.salesPersonId !== viewer.teamMemberId) {
      return { success: false, error: "Project not found." };
    }

    await generateDocument("INVOICE", input, {
      salesLeadId: project.salesLeadId,
      relatedPaymentId: paymentId,
    });

    revalidatePath(`/admin/sales-crm/projects/${salesProjectId}`);
    revalidatePath(`/sales/projects/${salesProjectId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    console.error("generateInvoice failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
