import "server-only";

import type { AILeadReport, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { computeOpportunityScore, type ScoringInputs } from "./scoring-engine";
import { buildBusinessIntelligenceMessages } from "./prompt-service";
import { requestBusinessIntelligence } from "./ai-engine";
import { getIndustryConversionRate } from "./learning-engine";
import { notifyHighOpportunityScore } from "./notify";
import { withAnalysisSlot } from "../analyzer/analysis-queue";

/** Exactly one LeadScoringConfig row is active at a time - creates the documented defaults if none exists yet (fresh install), never silently using hardcoded weights in the scoring call itself. */
export async function getActiveScoringConfig() {
  const active = await prisma.leadScoringConfig.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } });
  if (active) return active;
  return prisma.leadScoringConfig.create({ data: { active: true } });
}

interface AnalysisChecksShape {
  growthSignals?: { hasBlog: boolean; hasRecentContent: boolean };
}

export class BusinessNotFoundError extends Error {
  constructor() {
    super("Business not found");
  }
}

/**
 * The full report-generation pass for one Business: gathers real inputs
 * (latest completed website analysis, Google/social data, scoring
 * weights), computes the Opportunity Score via the pure scoring engine,
 * then makes the one Groq call for the narrative parts, and persists
 * everything together as a single AILeadReport row.
 */
export async function generateBusinessReport(businessId: string): Promise<AILeadReport> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new BusinessNotFoundError();

  const [websiteAnalysis, socialProfiles, config] = await Promise.all([
    prisma.businessWebsiteAnalysis.findFirst({ where: { businessId, status: "COMPLETE" }, orderBy: { completedAt: "desc" } }),
    prisma.socialProfile.findMany({ where: { businessId } }),
    getActiveScoringConfig(),
  ]);

  const growthSignals = (websiteAnalysis?.checks as AnalysisChecksShape | null)?.growthSignals ?? { hasBlog: false, hasRecentContent: false };

  // Priority: an admin's explicit manual override, then the real computed
  // rate from historical SalesLead outcomes (null below the trust
  // threshold - see learning-engine.ts), then the scoring engine's own
  // neutral default (0.2) if neither is available.
  const overrides = config.industryConversionOverrides as Record<string, number> | null;
  const manualOverride = business.industry && overrides ? overrides[business.industry] : undefined;
  const industryConversionRate = manualOverride ?? (business.industry ? await getIndustryConversionRate(business.industry) : null);

  const inputs: ScoringInputs = {
    websiteScore: websiteAnalysis?.overallScore ?? null,
    hasWebsite: !!business.website,
    googleRating: business.googleRating,
    googleReviewCount: business.googleReviewCount,
    industry: business.industry,
    industryConversionRate,
    hasPhone: !!business.phone,
    hasEmail: !!business.email,
    hasWhatsapp: !!business.whatsapp,
    socialProfileCount: socialProfiles.length,
    growthSignals,
  };

  const { opportunityScore, factors } = computeOpportunityScore(inputs, config);

  const messages = buildBusinessIntelligenceMessages({
    business,
    opportunityScore,
    scoreFactors: factors,
    websiteAnalysis,
    socialProfiles,
  });

  const intelligence = await withAnalysisSlot(() => requestBusinessIntelligence(messages));

  const report = await prisma.aILeadReport.create({
    data: {
      businessId,
      summary: intelligence.summary,
      opportunityScore,
      scoreFactors: factors as unknown as Prisma.InputJsonValue,
      recommendations: intelligence.recommendations as unknown as Prisma.InputJsonValue,
      suggestedOutreachMessage: intelligence.suggestedOutreachMessage,
      scoringConfigId: config.id,
      modelUsed: DEFAULT_GROQ_MODEL,
    },
  });

  await prisma.businessActivity.create({
    data: { businessId, type: "AI_REPORT_GENERATED", description: `Opportunity score ${opportunityScore}/100` },
  });
  await prisma.business.updateMany({ where: { id: businessId, status: "NEW" }, data: { status: "ANALYZED" } });

  try {
    await notifyHighOpportunityScore(business, report);
  } catch (error) {
    console.error("notifyHighOpportunityScore failed:", error);
  }

  return report;
}
