"use server";

import { revalidatePath } from "next/cache";
import type { Lead, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyLeadClaimed } from "@/features/leads/server/notify";

export type ClaimLeadResult =
  | { success: true }
  | { success: false; error: string; alreadyClaimed?: boolean };

/**
 * Uber/Ola-style "first to accept wins" claim. Race-safe via a conditional
 * updateMany (WHERE currentOwnerId IS NULL) inside a transaction, not a
 * read-then-write - Postgres row-locks during that UPDATE, so two reps
 * clicking simultaneously serialize: the loser gets count 0 and a friendly
 * "someone already claimed this" result instead of silently overwriting.
 * Deliberately separate from reassignOwner (src/actions/crm.ts), which
 * stays an unconditional admin override.
 */
export async function claimLead(leadId: string): Promise<ClaimLeadResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SALES") {
    return { success: false, error: "Not authorized." };
  }

  const teamMember = await prisma.teamMember.findUnique({ where: { userId: session.user.id } });
  if (!teamMember) {
    return { success: false, error: "Your sales profile isn't set up yet." };
  }

  try {
    const claimedLead = await prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<Lead | null> => {
      const { count } = await tx.lead.updateMany({
        where: { id: leadId, currentOwnerId: null },
        data: { currentOwnerId: teamMember.id },
      });
      if (count === 0) return null;

      await tx.leadAssignment.create({
        data: { leadId, ownerId: teamMember.id, assignedById: teamMember.id, reason: "INITIAL" },
      });
      await tx.leadHistory.create({
        data: { leadId, eventType: "CLAIMED", performedBy: teamMember.id },
      });
      return tx.lead.findUniqueOrThrow({ where: { id: leadId } });
    });

    if (!claimedLead) {
      return { success: false, error: "This lead was just claimed by someone else.", alreadyClaimed: true };
    }

    try {
      await notifyLeadClaimed(claimedLead, teamMember.id);
    } catch (error) {
      console.error("notifyLeadClaimed failed:", error);
    }

    revalidatePath("/sales/inbound");
    return { success: true };
  } catch (error) {
    console.error("claimLead failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
