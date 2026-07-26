import { prisma } from "@/lib/prisma";
import { isValidCronRequest } from "@/features/lead-intelligence/server/cron-auth";
import { runWebsiteAnalysisForBusiness } from "@/features/lead-intelligence/analyzer/run-analysis";
import { writeAuditLog } from "@/features/lead-intelligence/server/audit";

const BATCH_SIZE = 20;

/**
 * Scheduled website analysis for any Business with a website but no
 * completed analysis yet - capped batch per run to respect Vercel's
 * function duration limit and the Groq/website-fetch budget. Calls the
 * exact same runWebsiteAnalysisForBusiness every "Run analysis" click
 * uses, already routed through the concurrency-capped queue
 * (analysis-queue.ts) internally.
 */
export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const staleBusinesses = await prisma.business.findMany({
    where: { website: { not: null }, websiteAnalyses: { none: { status: "COMPLETE" } } },
    take: BATCH_SIZE,
    select: { id: true, website: true },
  });

  const results = [];
  for (const business of staleBusinesses) {
    if (!business.website) continue;
    const analysis = await runWebsiteAnalysisForBusiness(business.id, business.website);
    results.push({ businessId: business.id, status: analysis.status, overallScore: analysis.overallScore });
  }

  await writeAuditLog({
    action: "lead_intelligence.cron_analyze_stale",
    entityType: "Business",
    metadata: { processedCount: results.length },
  });

  return Response.json({ ok: true, processedCount: results.length, results });
}
