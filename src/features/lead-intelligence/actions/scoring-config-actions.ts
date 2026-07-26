"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { updateLeadScoringConfigSchema } from "../validation/scoring-config-schema";
import { writeAuditLog } from "../server/audit";

async function resolveActorId(userId: string): Promise<string | undefined> {
  const linked = await prisma.teamMember.findUnique({ where: { userId } });
  return linked?.id;
}

export type UpdateLeadScoringConfigResult = ActionResult & { configId?: string };

/**
 * Never mutates the active config in place - deactivates the old row and
 * inserts a new one, so every historical AILeadReport stays attributable
 * to the config that actually produced it (AILeadReport.scoringConfigId).
 * Called both from a manual hand-edit and from "Apply"/"Apply All" on a
 * Learning Engine suggestion (see scoring-config/page.tsx) - the
 * suggestion is advisory input into this same normal edit path, never a
 * separate auto-apply mechanism.
 */
export async function updateLeadScoringConfig(input: unknown): Promise<UpdateLeadScoringConfigResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = updateLeadScoringConfigSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const actorId = await resolveActorId(user.id);
    const current = await prisma.leadScoringConfig.findFirst({ where: { active: true } });

    const updated = await prisma.$transaction(async (tx) => {
      if (current) {
        await tx.leadScoringConfig.update({ where: { id: current.id }, data: { active: false } });
      }
      return tx.leadScoringConfig.create({
        data: { ...parsed.data, active: true, createdById: actorId },
      });
    });

    await writeAuditLog({
      actorId: actorId ?? null,
      action: "lead_intelligence.scoring_config_updated",
      entityType: "LeadScoringConfig",
      entityId: updated.id,
      metadata: { before: current, after: parsed.data },
    });

    revalidatePath("/admin/lead-intelligence/scoring-config");
    return { success: true, configId: updated.id };
  } catch (error) {
    console.error("updateLeadScoringConfig failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
