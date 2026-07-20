"use server";

import { revalidatePath } from "next/cache";
import type { OperationPriority, RequestStatus, OrderStatus, MeetingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/session";
import {
  updateRequestStatus,
  assignCounsellor,
  assignSalesPerson,
} from "@/features/offering-requests/actions/admin-request-actions";
import { updateOrderStatusAdmin } from "@/features/orders/actions/order-actions";
import type { ActionResult } from "@/actions/leads";
import {
  assignOperationSchema,
  internalCommentSchema,
  scheduleMeetingSchema,
  setPrioritySchema,
  setDueDateSchema,
  setNextActionSchema,
} from "../validation/operation-forms";

/**
 * Resolves "who is performing this action" the same way
 * src/actions/crm.ts's resolveActorId() does for Leads - prefers the
 * TeamMember linked to the signed-in User, falls back to undefined
 * (system-attributed) rather than blocking the action if no link exists
 * yet. Kept local rather than importing from crm.ts, which is app-level
 * Lead-CRM code this feature deliberately stays decoupled from (see
 * prisma/schema.prisma's OperationItem comment on the two systems being
 * parallel, not merged).
 */
async function resolveActorTeamMemberId(): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return undefined;
  const teamMember = await prisma.teamMember.findUnique({ where: { userId: session.user.id } });
  return teamMember?.id;
}

function revalidateOperationItem(id: string) {
  revalidatePath("/admin/operations");
  revalidatePath(`/admin/operations/${id}`);
}

export async function assignOperationItem(operationItemId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = assignOperationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const item = await prisma.operationItem.findUnique({ where: { id: operationItemId } });
    if (!item) return { success: false, error: "Not found" };

    const assignedById = await resolveActorTeamMemberId();
    const wasAssigned = !!item.assignedToId;

    await prisma.$transaction([
      prisma.operationItem.update({
        where: { id: operationItemId },
        data: { assignedToId: parsed.data.assigneeId },
      }),
      prisma.operationAssignment.updateMany({
        where: { operationItemId, isActive: true },
        data: { isActive: false },
      }),
      prisma.operationAssignment.create({
        data: {
          operationItemId,
          assigneeId: parsed.data.assigneeId,
          assignedById,
          role: parsed.data.role,
          reason: wasAssigned ? "MANUAL_OVERRIDE" : "INITIAL",
        },
      }),
      prisma.activityLog.create({
        data: {
          operationItemId,
          type: wasAssigned ? "REASSIGNED" : "ASSIGNED",
          description: `Assigned as ${parsed.data.role}`,
          performedById: assignedById,
        },
      }),
    ]);

    // Keeps OfferingRequest's own assignedCounsellorId/assignedSalesPersonId
    // fields (Phase 5) in sync for REQUEST-type items - reused, not
    // duplicated: the actual field-update + its own history entry still
    // live in admin-request-actions.ts.
    if (item.type === "REQUEST" && item.requestId) {
      if (parsed.data.role === "COUNSELLOR") {
        await assignCounsellor(item.requestId, parsed.data.assigneeId);
      } else if (parsed.data.role === "SALES") {
        await assignSalesPerson(item.requestId, parsed.data.assigneeId);
      }
    }

    revalidateOperationItem(operationItemId);
    return { success: true };
  } catch (error) {
    console.error("assignOperationItem failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Dispatches to the real, already-existing status-update action for the
 * item's source type - updateRequestStatus (Phase 5) or
 * updateOrderStatusAdmin (added this phase) - each of which owns that
 * record's own status/history. This action's only job is the unified
 * ActivityLog entry Operations staff see regardless of source type; the
 * customer-facing OfferingRequestHistory/Order status stay each source's
 * own concern, not duplicated here.
 */
export async function changeOperationStatus(operationItemId: string, status: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const item = await prisma.operationItem.findUnique({ where: { id: operationItemId } });
  if (!item) return { success: false, error: "Not found" };

  const fromStatus =
    item.type === "REQUEST"
      ? (await prisma.offeringRequest.findUnique({ where: { id: item.requestId! } }))?.status
      : (await prisma.order.findUnique({ where: { id: item.orderId! } }))?.status;

  const result =
    item.type === "REQUEST"
      ? await updateRequestStatus(item.requestId!, status as RequestStatus)
      : await updateOrderStatusAdmin(item.orderId!, status as OrderStatus);

  if (!result.success) return result;

  try {
    const performedById = await resolveActorTeamMemberId();
    await prisma.activityLog.create({
      data: {
        operationItemId,
        type: "STATUS_CHANGED",
        description: `${fromStatus ?? "?"} -> ${status}`,
        metadata: { fromStatus, toStatus: status },
        performedById,
      },
    });
    revalidateOperationItem(operationItemId);
    return { success: true };
  } catch (error) {
    console.error("changeOperationStatus activity log failed:", error);
    return { success: true }; // the underlying status change already succeeded
  }
}

export async function setPriority(operationItemId: string, priority: OperationPriority): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = setPrioritySchema.safeParse({ priority });
  if (!parsed.success) return { success: false, error: "Invalid priority" };

  try {
    const current = await prisma.operationItem.findUnique({ where: { id: operationItemId } });
    if (!current) return { success: false, error: "Not found" };

    const performedById = await resolveActorTeamMemberId();
    await prisma.$transaction([
      prisma.operationItem.update({ where: { id: operationItemId }, data: { priority: parsed.data.priority } }),
      prisma.activityLog.create({
        data: {
          operationItemId,
          type: "PRIORITY_CHANGED",
          description: `${current.priority} -> ${parsed.data.priority}`,
          performedById,
        },
      }),
    ]);
    revalidateOperationItem(operationItemId);
    return { success: true };
  } catch (error) {
    console.error("setPriority failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function setDueDate(operationItemId: string, dueDate: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = setDueDateSchema.safeParse({ dueDate });
  if (!parsed.success) return { success: false, error: "Invalid date" };

  try {
    const performedById = await resolveActorTeamMemberId();
    const value = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    await prisma.$transaction([
      prisma.operationItem.update({ where: { id: operationItemId }, data: { dueDate: value } }),
      prisma.activityLog.create({
        data: {
          operationItemId,
          type: "DUE_DATE_CHANGED",
          description: value ? value.toLocaleDateString("en-IN") : "Cleared",
          performedById,
        },
      }),
    ]);
    revalidateOperationItem(operationItemId);
    return { success: true };
  } catch (error) {
    console.error("setDueDate failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function setNextAction(operationItemId: string, nextAction: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = setNextActionSchema.safeParse({ nextAction });
  if (!parsed.success) return { success: false, error: "Invalid input" };

  try {
    await prisma.operationItem.update({
      where: { id: operationItemId },
      data: { nextAction: parsed.data.nextAction || null },
    });
    revalidateOperationItem(operationItemId);
    return { success: true };
  } catch (error) {
    console.error("setNextAction failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function addInternalComment(operationItemId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = internalCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const authorId = await resolveActorTeamMemberId();
    await prisma.$transaction([
      prisma.internalComment.create({
        data: { operationItemId, content: parsed.data.content, authorId },
      }),
      prisma.activityLog.create({
        data: { operationItemId, type: "NOTE_ADDED", description: parsed.data.content, performedById: authorId },
      }),
    ]);
    revalidateOperationItem(operationItemId);
    return { success: true };
  } catch (error) {
    console.error("addInternalComment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function scheduleMeeting(operationItemId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = scheduleMeetingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const scheduledById = await resolveActorTeamMemberId();
    const scheduledAt = new Date(parsed.data.scheduledAt);
    await prisma.$transaction([
      prisma.meeting.create({
        data: {
          operationItemId,
          scheduledAt,
          method: parsed.data.method,
          notes: parsed.data.notes,
          scheduledById,
        },
      }),
      prisma.activityLog.create({
        data: {
          operationItemId,
          type: "MEETING_SCHEDULED",
          description: scheduledAt.toLocaleString("en-IN"),
          performedById: scheduledById,
        },
      }),
    ]);
    revalidateOperationItem(operationItemId);
    return { success: true };
  } catch (error) {
    console.error("scheduleMeeting failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateMeetingStatus(meetingId: string, status: MeetingStatus): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const meeting = await prisma.meeting.update({ where: { id: meetingId }, data: { status } });
    revalidateOperationItem(meeting.operationItemId);
    return { success: true };
  } catch (error) {
    console.error("updateMeetingStatus failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
