"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { runWebsiteAnalysisForBusiness } from "../analyzer/run-analysis";
import { writeAuditLog } from "../server/audit";

async function resolveActorId(userId: string): Promise<string | undefined> {
  const linked = await prisma.teamMember.findUnique({ where: { userId } });
  return linked?.id;
}

export type AnalyzeBusinessResult = ActionResult & { overallScore?: number };

/** Runs the full deep website-analysis pass (security/SEO/performance-proxy/business/content checks) for an existing Business - distinct from the website *connector* used for discovery, which only extracts basic fields. */
export async function analyzeBusinessWebsite(businessId: string): Promise<AnalyzeBusinessResult> {
  await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return { success: false, error: "Business not found." };
  if (!business.website) return { success: false, error: "This business has no website on file to analyze." };

  try {
    const analysis = await runWebsiteAnalysisForBusiness(businessId, business.website);
    if (analysis.status === "FAILED") {
      return { success: false, error: analysis.errorMessage ?? "Couldn't analyze this website." };
    }
    revalidatePath(`/admin/lead-intelligence/businesses/${businessId}`);
    return { success: true, overallScore: analysis.overallScore ?? undefined };
  } catch (error) {
    console.error("analyzeBusinessWebsite failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type DismissBusinessResult = ActionResult;

/** Admin marks a Business not worth pursuing - excluded from default views, reversible via reactivateBusiness. */
export async function dismissBusiness(businessId: string): Promise<DismissBusinessResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  try {
    const actorId = await resolveActorId(user.id);
    await prisma.business.update({ where: { id: businessId }, data: { status: "DISMISSED" } });
    await prisma.businessActivity.create({ data: { businessId, type: "DISMISSED", performedById: actorId ?? null } });
    revalidatePath("/admin/lead-intelligence/businesses");
    revalidatePath(`/admin/lead-intelligence/businesses/${businessId}`);
    return { success: true };
  } catch (error) {
    console.error("dismissBusiness failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function reactivateBusiness(businessId: string): Promise<DismissBusinessResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  try {
    const actorId = await resolveActorId(user.id);
    await prisma.business.update({ where: { id: businessId }, data: { status: "NEW" } });
    await prisma.businessActivity.create({ data: { businessId, type: "REACTIVATED", performedById: actorId ?? null } });
    revalidatePath("/admin/lead-intelligence/businesses");
    revalidatePath(`/admin/lead-intelligence/businesses/${businessId}`);
    return { success: true };
  } catch (error) {
    console.error("reactivateBusiness failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type BulkDismissResult = ActionResult & { dismissedCount?: number };

/**
 * Bulk-select dismiss from the businesses list (the SRS's "Bulk Actions"
 * requirement). Deliberately no bulk hard-delete alongside it - dismiss is
 * reversible (reactivateBusiness) and already achieves "remove from
 * default views," while a bulk hard-delete would be an irreversible,
 * audit-trail-destroying action with no real benefit over dismiss. Writes
 * one AuditLog entry for the whole batch, not one per business, matching
 * this codebase's "one consolidated record for a bulk action" convention.
 */
export async function bulkDismissBusinesses(businessIds: string[]): Promise<BulkDismissResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  if (businessIds.length === 0) return { success: false, error: "No businesses selected." };

  try {
    const actorId = await resolveActorId(user.id);
    const result = await prisma.business.updateMany({ where: { id: { in: businessIds } }, data: { status: "DISMISSED" } });
    await prisma.businessActivity.createMany({
      data: businessIds.map((businessId) => ({ businessId, type: "DISMISSED" as const, performedById: actorId ?? null })),
    });

    await writeAuditLog({
      actorId: actorId ?? null,
      action: "lead_intelligence.business_bulk_dismissed",
      entityType: "Business",
      metadata: { businessIds, count: result.count },
    });

    revalidatePath("/admin/lead-intelligence/businesses");
    return { success: true, dismissedCount: result.count };
  } catch (error) {
    console.error("bulkDismissBusinesses failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
