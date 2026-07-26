import "server-only";

import { prisma } from "@/lib/prisma";
import type { Business, AILeadReport, LeadIntelligenceSearchRun } from "@prisma/client";
import { createNotifications } from "@/features/notifications/server/creation";

const HIGH_OPPORTUNITY_THRESHOLD = 75;

/** TeamMembers who run the whole sales pipeline (same "full access" tier as resolveLeadIntelligenceViewer) - the right audience for lead-intelligence-wide notifications, not any one salesperson. */
async function getSalesManagerUserIds(): Promise<string[]> {
  const managers = await prisma.teamMember.findMany({
    where: { role: { in: ["SALES_MANAGER", "FOUNDER"] }, userId: { not: null } },
    select: { userId: true },
  });
  return managers.map((m) => m.userId).filter((id): id is string => !!id);
}

/**
 * Fires once per report that crosses the "hot lead" threshold - called
 * non-fatally by generate-report.ts, same discipline every other
 * cross-feature notification call in this codebase follows (a failed
 * notification must never make a successful report generation look
 * failed).
 */
export async function notifyHighOpportunityScore(business: Business, report: AILeadReport): Promise<void> {
  if (report.opportunityScore < HIGH_OPPORTUNITY_THRESHOLD) return;

  const userIds = await getSalesManagerUserIds();
  if (userIds.length === 0) return;

  await createNotifications(
    userIds.map((userId) => ({
      userId,
      type: "BUSINESS_HIGH_OPPORTUNITY_SCORE" as const,
      title: "Hot lead discovered",
      body: `${business.businessName} scored ${report.opportunityScore}/100 - worth a look.`,
      link: `/admin/lead-intelligence/businesses/${business.id}`,
    }))
  );
}

/** Fires when a connector run ends FAILED - the triggering admin for a manual run, or every Sales Manager for a cron run (nobody clicked it, so nobody would otherwise know). */
export async function notifyRunFailed(run: LeadIntelligenceSearchRun): Promise<void> {
  let userIds: string[] = [];

  if (run.trigger === "MANUAL" && run.triggeredById) {
    const actor = await prisma.teamMember.findUnique({ where: { id: run.triggeredById }, select: { userId: true } });
    if (actor?.userId) userIds = [actor.userId];
  } else {
    userIds = await getSalesManagerUserIds();
  }

  if (userIds.length === 0) return;

  await createNotifications(
    userIds.map((userId) => ({
      userId,
      type: "LEAD_INTELLIGENCE_RUN_FAILED" as const,
      title: "A discovery run failed",
      body: `${run.connectorType.replace(/_/g, " ")} run failed with ${run.errorCount} error(s).`,
      link: "/admin/lead-intelligence/runs",
    }))
  );
}
