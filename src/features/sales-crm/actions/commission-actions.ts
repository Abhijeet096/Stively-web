"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { rejectCommissionSchema } from "../validation/project-schemas";
import { createNotification } from "@/features/notifications/server/creation";

async function actorTeamMemberId(userId: string): Promise<string | undefined> {
  const teamMember = await prisma.teamMember.findUnique({ where: { userId } });
  return teamMember?.id;
}

async function notifySalesperson(salesPersonId: string, type: "COMMISSION_APPROVED" | "COMMISSION_PAID", title: string, body: string) {
  const member = await prisma.teamMember.findUnique({ where: { id: salesPersonId }, select: { userId: true } });
  if (!member?.userId) return;
  try {
    await createNotification({ userId: member.userId, type, title, body, link: "/sales/commission" });
  } catch (error) {
    console.error("notifySalesperson failed:", error);
  }
}

/** Admin-only, per the brief's admin commission page: View All, Approve, Reject, Mark Paid. */
export async function approveCommission(commissionId: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  try {
    const commission = await prisma.salesCommission.findUnique({ where: { id: commissionId } });
    if (!commission) return { success: false, error: "Commission not found." };
    if (commission.status !== "PENDING") return { success: false, error: "Only a pending commission can be approved." };

    await prisma.salesCommission.update({
      where: { id: commissionId },
      data: { status: "APPROVED", approvedById: await actorTeamMemberId(user.id), approvedAt: new Date() },
    });

    await notifySalesperson(commission.salesPersonId, "COMMISSION_APPROVED", "Commission approved", "One of your commissions has been approved and is ready to be paid.");

    revalidatePath("/admin/sales-crm/commission");
    revalidatePath("/sales/commission");
    return { success: true };
  } catch (error) {
    console.error("approveCommission failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function rejectCommission(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = rejectCommissionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const commission = await prisma.salesCommission.findUnique({ where: { id: data.commissionId } });
    if (!commission) return { success: false, error: "Commission not found." };
    if (commission.status !== "PENDING") return { success: false, error: "Only a pending commission can be rejected." };

    await prisma.salesCommission.update({
      where: { id: data.commissionId },
      data: { status: "REJECTED", rejectionReason: data.reason },
    });

    revalidatePath("/admin/sales-crm/commission");
    revalidatePath("/sales/commission");
    return { success: true };
  } catch (error) {
    console.error("rejectCommission failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function markCommissionPaid(commissionId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  try {
    const commission = await prisma.salesCommission.findUnique({ where: { id: commissionId } });
    if (!commission) return { success: false, error: "Commission not found." };
    if (commission.status !== "APPROVED") return { success: false, error: "Only an approved commission can be marked paid." };

    await prisma.salesCommission.update({
      where: { id: commissionId },
      data: { status: "PAID", paidAt: new Date() },
    });

    await notifySalesperson(commission.salesPersonId, "COMMISSION_PAID", "Commission paid", "A commission payout has been marked as paid.");

    revalidatePath("/admin/sales-crm/commission");
    revalidatePath("/sales/commission");
    return { success: true };
  } catch (error) {
    console.error("markCommissionPaid failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
