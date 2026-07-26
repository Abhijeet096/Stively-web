import "server-only";

import type { Prisma, BusinessWebsiteAnalysis } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fetchPageSafely } from "./fetch-page";
import { parsePage } from "./parse-page";
import { runSecurityChecks } from "./checks/security-checks";
import { runSeoChecks } from "./checks/seo-checks";
import { runPerformanceChecks } from "./checks/performance-checks";
import { runBusinessChecks } from "./checks/business-checks";
import { runContentChecks, detectGrowthSignals } from "./checks/content-checks";
import { computeAnalysisScores, type AnalysisChecks } from "./scoring";
import { withAnalysisSlot } from "./analysis-queue";
import { upsertSocialProfiles } from "../server/creation";

async function checkReachable(url: string): Promise<boolean> {
  try {
    const page = await fetchPageSafely(url);
    return page.status >= 200 && page.status < 400;
  } catch {
    return false;
  }
}

/**
 * The full deep-analysis pass for one Business's website - a separate,
 * heavier pass than the website *connector*'s quick field-extraction
 * (server/creation.ts's chaining), producing a scored BusinessWebsiteAnalysis
 * row. Runs through the concurrency-capped queue so a batch cron run or a
 * bulk admin action never fires more than 2 analyses at once.
 */
export async function runWebsiteAnalysisForBusiness(businessId: string, url: string): Promise<BusinessWebsiteAnalysis> {
  return withAnalysisSlot(async () => {
    const analysis = await prisma.businessWebsiteAnalysis.create({ data: { businessId, url, status: "ANALYZING" } });

    try {
      const page = await fetchPageSafely(url);
      const parsed = parsePage(page.html);

      const origin = new URL(page.url).origin;
      const [robotsTxtReachable, sitemapReachable] = await Promise.all([checkReachable(`${origin}/robots.txt`), checkReachable(`${origin}/sitemap.xml`)]);

      const checks: AnalysisChecks = {
        security: runSecurityChecks(page, parsed),
        seo: runSeoChecks(parsed, { robotsTxtReachable, sitemapReachable }),
        performance: runPerformanceChecks(page, parsed),
        business: runBusinessChecks(parsed),
        content: runContentChecks(parsed),
        growthSignals: detectGrowthSignals(parsed),
      };
      const scores = computeAnalysisScores(checks);

      const updated = await prisma.businessWebsiteAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: "COMPLETE",
          securityScore: scores.securityScore,
          seoScore: scores.seoScore,
          performanceScore: scores.performanceScore,
          contentScore: scores.contentScore,
          overallScore: scores.overallScore,
          checks: checks as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      await upsertSocialProfiles(businessId, parsed.socialLinks);
      await prisma.businessActivity.create({
        data: { businessId, type: "WEBSITE_ANALYZED", description: `Website analyzed - overall score ${scores.overallScore}/100` },
      });
      await prisma.business.updateMany({ where: { id: businessId, status: "NEW" }, data: { status: "ANALYZED" } });

      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      console.error("runWebsiteAnalysisForBusiness failed:", error);
      return prisma.businessWebsiteAnalysis.update({
        where: { id: analysis.id },
        data: { status: "FAILED", errorMessage: message, completedAt: new Date() },
      });
    }
  });
}
