"use server";

import { revalidatePath } from "next/cache";

import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { createProjectPaymentSchema, markPaymentPaidSchema } from "../validation/project-schemas";
import { resolveSalesCrmViewer } from "../server/rbac";
import { generateCommissionForPayment } from "../server/commission-engine";

async function assertProjectAccess(salesProjectId: string, userId: string, role: Role) {
  const viewer = await resolveSalesCrmViewer(userId, role);
  const project = await prisma.salesProject.findUnique({ where: { id: salesProjectId } });
  if (!project) return { ok: false as const, error: "Project not found." };
  if (!viewer.hasFullAccess && project.salesPersonId !== viewer.teamMemberId) {
    return { ok: false as const, error: "Project not found." };
  }
  return { ok: true as const, project };
}

/** A project can have multiple installments - each one its own row, tracked Pending/Due/Paid. Any Sales CRM staff who can see the project can record a scheduled payment. */
export async function createProjectPayment(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = createProjectPaymentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const access = await assertProjectAccess(data.salesProjectId, user.id, user.role);
    if (!access.ok) return { success: false, error: access.error };

    await prisma.salesProjectPayment.create({
      data: {
        salesProjectId: data.salesProjectId,
        amount: data.amount,
        label: data.label,
        dueDate: data.dueDate,
        method: data.method,
        reference: data.reference,
      },
    });

    revalidatePath(`/admin/sales-crm/projects/${data.salesProjectId}`);
    revalidatePath(`/sales/projects/${data.salesProjectId}`);
    return { success: true };
  } catch (error) {
    console.error("createProjectPayment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Marks a payment PAID - the sole trigger point for commission generation
 * (see generateCommissionForPayment). Commission is always calculated on
 * this actual received amount, never on the project's quoted totalValue.
 */
export async function markPaymentPaid(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = markPaymentPaidSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const payment = await prisma.salesProjectPayment.findUnique({ where: { id: data.paymentId } });
    if (!payment) return { success: false, error: "Payment not found." };
    if (payment.status === "PAID") return { success: false, error: "This payment is already marked paid." };

    const access = await assertProjectAccess(payment.salesProjectId, user.id, user.role);
    if (!access.ok) return { success: false, error: access.error };

    await prisma.salesProjectPayment.update({
      where: { id: data.paymentId },
      data: {
        status: "PAID",
        paidAt: data.paidAt ?? new Date(),
        method: data.method ?? payment.method,
        reference: data.reference ?? payment.reference,
        recordedById: await prisma.teamMember.findUnique({ where: { userId: user.id }, select: { id: true } }).then((m) => m?.id),
      },
    });

    await generateCommissionForPayment(data.paymentId);

    revalidatePath(`/admin/sales-crm/projects/${payment.salesProjectId}`);
    revalidatePath(`/sales/projects/${payment.salesProjectId}`);
    revalidatePath("/admin/sales-crm/commission");
    revalidatePath("/sales/commission");
    return { success: true };
  } catch (error) {
    console.error("markPaymentPaid failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
