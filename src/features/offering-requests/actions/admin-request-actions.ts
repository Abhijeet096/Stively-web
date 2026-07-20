"use server";

import { revalidatePath } from "next/cache";
import type { RequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { formatRequestNumber } from "../lib/request-number";
import { emitOfferingRequestEvent } from "../lib/events";
import { createEnrollmentFromRequest } from "@/features/enrollments/server/creation";

/**
 * Admin CRUD for OfferingRequest - scaffolded per the brief's "Admin
 * Preparation" section, exactly the same pattern as Phase 4's
 * offering-admin-actions.ts. No CRM UI calls these yet; every action is
 * still real, Zod-adjacent-validated (enum params are already narrow
 * types, not free text), and gated by requireRole - a future CRM becomes a
 * UI-only addition on top of this, not a new backend.
 */

export async function assignCounsellor(requestId: string, counsellorId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const updated = await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        assignedCounsellorId: counsellorId,
        history: { create: { eventType: "COUNSELLOR_ASSIGNED", description: counsellorId } },
      },
    });
    emitOfferingRequestEvent("STATUS_CHANGED", updated);
    revalidatePath(`/student/requests/${requestId}`);
    return { success: true };
  } catch (error) {
    console.error("assignCounsellor failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function assignSalesPerson(requestId: string, salesPersonId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        assignedSalesPersonId: salesPersonId,
        history: { create: { eventType: "SALESPERSON_ASSIGNED", description: salesPersonId } },
      },
    });
    revalidatePath(`/client/requests/${requestId}`);
    return { success: true };
  } catch (error) {
    console.error("assignSalesPerson failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateRequestStatus(requestId: string, status: RequestStatus): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.offeringRequest.findUnique({ where: { id: requestId } });
    if (!current) return { success: false, error: "Request not found" };

    const updated = await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(status === "APPROVED" ? { approvedAt: new Date() } : {}),
        ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
        history: {
          create: { eventType: "STATUS_CHANGED", fromStatus: current.status, toStatus: status },
        },
      },
    });
    emitOfferingRequestEvent("STATUS_CHANGED", updated);

    // Non-fatal by design (Phase 8) - see submitRequest's identical
    // comment in request-actions.ts. Only fires on the actual DRAFT/etc ->
    // APPROVED transition, not on every subsequent status change once
    // already approved (OfferingEnrollment.offeringRequestId is @unique,
    // so a second attempt would fail loudly rather than duplicate anyway).
    if (status === "APPROVED" && current.status !== "APPROVED") {
      try {
        await createEnrollmentFromRequest(updated);
      } catch (error) {
        console.error("createEnrollmentFromRequest failed:", error);
      }
    }

    revalidatePath(`/student/requests/${requestId}`);
    revalidatePath(`/client/requests/${requestId}`);
    return { success: true };
  } catch (error) {
    console.error("updateRequestStatus failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function addInternalNote(requestId: string, note: string): Promise<ActionResult> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.offeringRequest.findUnique({ where: { id: requestId } });
    if (!current) return { success: false, error: "Request not found" };

    await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        internalNotes: current.internalNotes ? `${current.internalNotes}\n\n${note}` : note,
        history: { create: { eventType: "NOTE_ADDED", description: note, performedBy: admin.id } },
      },
    });
    return { success: true };
  } catch (error) {
    console.error("addInternalNote failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function approveRequest(requestId: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.offeringRequest.findUnique({ where: { id: requestId } });
    if (!current) return { success: false, error: "Request not found" };

    const updated = await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        history: { create: { eventType: "APPROVED", fromStatus: current.status, toStatus: "APPROVED" } },
      },
    });
    emitOfferingRequestEvent("APPROVED", updated);

    if (current.status !== "APPROVED") {
      try {
        await createEnrollmentFromRequest(updated);
      } catch (error) {
        console.error("createEnrollmentFromRequest failed:", error);
      }
    }

    revalidatePath(`/student/requests/${requestId}`);
    revalidatePath(`/client/requests/${requestId}`);
    return { success: true };
  } catch (error) {
    console.error("approveRequest failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function rejectRequest(requestId: string, reason?: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const current = await prisma.offeringRequest.findUnique({ where: { id: requestId } });
    if (!current) return { success: false, error: "Request not found" };

    const updated = await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        history: {
          create: { eventType: "REJECTED", fromStatus: current.status, toStatus: "REJECTED", description: reason },
        },
      },
    });
    emitOfferingRequestEvent("REJECTED", updated);
    revalidatePath(`/student/requests/${requestId}`);
    revalidatePath(`/client/requests/${requestId}`);
    return { success: true };
  } catch (error) {
    console.error("rejectRequest failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * A real, working CSV export (not a stub) - cheap to build correctly and
 * genuinely useful the moment a CMS exists to trigger it, unlike a fake
 * placeholder that would need rewriting later anyway.
 */
export async function exportRequestsToCsv(
  status?: RequestStatus
): Promise<{ success: true; csv: string } | { success: false; error: string }> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const requests = await prisma.offeringRequest.findMany({
      where: status ? { status } : {},
      include: { offering: { select: { title: true } }, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    const header = ["Request Number", "Type", "Status", "Offering", "Name", "Email", "Submitted At"];
    const rows = requests.map((r) => [
      formatRequestNumber(r.sequence),
      r.requestType,
      r.status,
      r.offering.title,
      r.user.name ?? "",
      r.user.email ?? "",
      r.submittedAt?.toISOString() ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return { success: true, csv };
  } catch (error) {
    console.error("exportRequestsToCsv failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
