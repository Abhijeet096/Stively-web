"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { updateLeadSchema, addNoteSchema, reassignOwnerSchema } from "@/lib/validations/crm";
import { getDefaultOwner } from "@/lib/queries/team-members";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/actions/leads";

/**
 * Resolves "who is performing this action" from the real logged-in
 * session now that authentication exists (this layout is gated by
 * requireRole("ADMIN", "SUPER_ADMIN") in src/app/(dashboard)/layout.tsx,
 * so a session is always present here). Prefers the CRM ownership
 * identity (TeamMember) linked to the signed-in User via
 * TeamMember.userId - see prisma/schema.prisma's comment on that link for
 * why it's a link, not a merge. Falls back to today's getDefaultOwner()
 * behavior when a logged-in admin hasn't been linked to a TeamMember row
 * yet, so existing CRM behavior never regresses mid-rollout.
 */
async function resolveActorId(): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.id) {
    const linked = await prisma.teamMember.findUnique({ where: { userId: session.user.id } });
    if (linked) return linked.id;
  }

  const founder = await getDefaultOwner();
  return founder?.id;
}

/**
 * Updates status/priority/nextFollowUpAt/lostReason on a lead. Every
 * change creates its own, semantically-correct LeadHistory event rather
 * than one generic "lead updated" entry - a status change and a
 * follow-up-date change are different facts, and the timeline (v1.2 §3)
 * is supposed to be a real record of what happened, not a diff dump.
 */
export async function updateLead(
  leadId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    nextFollowUpAt: formData.get("nextFollowUpAt") || undefined,
    lostReason: formData.get("lostReason") || undefined,
    leadType: formData.get("leadType") || undefined,
    companyName: formData.get("companyName") || undefined,
  };

  const parsed = updateLeadSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid update" };
  }
  const data = parsed.data;

  try {
    const current = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!current) {
      return { success: false, error: "Lead not found" };
    }

    const actorId = await resolveActorId();

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.lead.update({
        where: { id: leadId },
        data: {
          ...(data.status ? { status: data.status } : {}),
          ...(data.priority ? { priority: data.priority } : {}),
          ...(data.nextFollowUpAt !== undefined
            ? { nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null }
            : {}),
          ...(data.lostReason ? { lostReason: data.lostReason } : {}),
          ...(data.leadType ? { leadType: data.leadType } : {}),
          ...(data.companyName !== undefined ? { companyName: data.companyName || null } : {}),
        },
      });

      if (data.leadType && data.leadType !== current.leadType) {
        await tx.leadHistory.create({
          data: {
            leadId,
            eventType: "STATUS_CHANGED",
            description: `Type changed from ${current.leadType.toLowerCase()} to ${data.leadType.toLowerCase()}`,
            performedBy: actorId,
          },
        });
      }

      if (data.status && data.status !== current.status) {
        await tx.leadHistory.create({
          data: {
            leadId,
            eventType: "STATUS_CHANGED",
            fromStatus: current.status,
            toStatus: data.status,
            performedBy: actorId,
          },
        });
      }

      if (data.nextFollowUpAt !== undefined) {
        await tx.leadHistory.create({
          data: {
            leadId,
            eventType: "FOLLOW_UP_SCHEDULED",
            description: data.nextFollowUpAt
              ? `Follow-up scheduled for ${data.nextFollowUpAt}`
              : "Follow-up date cleared",
            performedBy: actorId,
          },
        });
      }

      if (data.priority && data.priority !== current.priority) {
        await tx.leadHistory.create({
          data: {
            leadId,
            eventType: "STATUS_CHANGED",
            description: `Priority changed from ${current.priority} to ${data.priority}`,
            performedBy: actorId,
          },
        });
      }
    });

    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/leads");
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "This email already has a lead of that type - merge or update the existing one instead." };
    }
    console.error("updateLead failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Founder-authored note. No edit, no delete, per this task's explicit scope - create only. */
export async function addLeadNote(
  leadId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const content = formData.get("content");
  const parsed = addNoteSchema.safeParse({ leadId, content });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid note" };
  }

  try {
    const actorId = await resolveActorId();

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.leadNote.create({
        data: { leadId: parsed.data.leadId, content: parsed.data.content, authorId: actorId },
      });
      await tx.leadHistory.create({
        data: { leadId: parsed.data.leadId, eventType: "NOTE_ADDED", performedBy: actorId },
      });
    });

    revalidatePath(`/admin/leads/${leadId}`);
    return { success: true };
  } catch (error) {
    console.error("addLeadNote failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Reassigns a lead's owner - the exact flow designed in
 * docs/architecture/lead-intake-system.md §3/§6: the current active
 * LeadAssignment is marked inactive, a new one is created with the given
 * reason, and Lead.currentOwnerId is updated to match (the denormalized
 * pointer kept in sync for fast owner-filtered queries, per that
 * document's reasoning).
 */
export async function reassignOwner(
  leadId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = reassignOwnerSchema.safeParse({
    leadId,
    newOwnerId: formData.get("newOwnerId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid reassignment" };
  }
  const data = parsed.data;

  try {
    const actorId = await resolveActorId();

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.leadAssignment.updateMany({
        where: { leadId: data.leadId, isActive: true },
        data: { isActive: false },
      });
      await tx.leadAssignment.create({
        data: {
          leadId: data.leadId,
          ownerId: data.newOwnerId,
          assignedById: actorId,
          reason: data.reason,
        },
      });
      await tx.lead.update({
        where: { id: data.leadId },
        data: { currentOwnerId: data.newOwnerId },
      });
      await tx.leadHistory.create({
        data: { leadId: data.leadId, eventType: "REASSIGNED", performedBy: actorId },
      });
    });

    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/leads");
    return { success: true };
  } catch (error) {
    console.error("reassignOwner failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
