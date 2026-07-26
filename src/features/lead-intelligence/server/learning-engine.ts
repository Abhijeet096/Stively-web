import "server-only";

import { prisma } from "@/lib/prisma";
import type { LeadScoringConfig, SalesLeadSource } from "@prisma/client";

const MIN_SAMPLE_FOR_TRUST = 5;

/**
 * Read-only aggregation over real Sales CRM history - never writes to
 * SalesLead/SalesProject/etc. Every function here is advisory input for a
 * human (the scoring-config admin page's "Suggested Weight Adjustments"
 * panel) - nothing in this file mutates LeadScoringConfig itself. See
 * generate-report.ts's comment on why: no precedent in this codebase for
 * auto-mutating scoring, and current CRM data volume is too small for a
 * fully automated feedback loop to be reliable.
 */

/** WON / (WON + LOST) for a given industry - null (not 0) below the trust threshold, so callers don't mistake "not enough data" for "this industry doesn't convert." */
export async function getIndustryConversionRate(industry: string): Promise<number | null> {
  const [won, lost] = await Promise.all([
    prisma.salesLead.count({ where: { industry, status: "WON" } }),
    prisma.salesLead.count({ where: { industry, status: "LOST" } }),
  ]);
  const total = won + lost;
  if (total < MIN_SAMPLE_FOR_TRUST) return null;
  return won / total;
}

export interface IndustryStat {
  industry: string;
  won: number;
  lost: number;
  conversionRate: number;
  avgDealSizePaise: number | null;
  avgSalesCycleDays: number | null;
}

/** One real row per industry that has at least one WON lead - deal size and sales-cycle length averaged from actual SalesProject data. */
export async function getIndustryStats(): Promise<IndustryStat[]> {
  const wonLeadsWithProjects = await prisma.salesLead.findMany({
    where: { status: "WON", industry: { not: null }, project: { isNot: null } },
    select: { industry: true, createdAt: true, project: { select: { totalValue: true, createdAt: true } } },
  });
  const lostByIndustry = await prisma.salesLead.groupBy({ by: ["industry"], where: { status: "LOST", industry: { not: null } }, _count: { industry: true } });
  const lostMap = new Map(lostByIndustry.map((row) => [row.industry, row._count.industry]));

  const byIndustry = new Map<string, { won: number; dealSizes: number[]; cycleDays: number[] }>();
  for (const lead of wonLeadsWithProjects) {
    const industry = lead.industry!;
    const entry = byIndustry.get(industry) ?? { won: 0, dealSizes: [], cycleDays: [] };
    entry.won++;
    if (lead.project) {
      entry.dealSizes.push(lead.project.totalValue);
      const cycleDays = (lead.project.createdAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (cycleDays >= 0) entry.cycleDays.push(cycleDays);
    }
    byIndustry.set(industry, entry);
  }

  const average = (nums: number[]) => (nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null);

  return Array.from(byIndustry.entries()).map(([industry, entry]) => {
    const lost = lostMap.get(industry) ?? 0;
    const total = entry.won + lost;
    return {
      industry,
      won: entry.won,
      lost,
      conversionRate: total > 0 ? entry.won / total : 0,
      avgDealSizePaise: average(entry.dealSizes),
      avgSalesCycleDays: average(entry.cycleDays),
    };
  });
}

export interface SourceConversion {
  source: SalesLeadSource;
  won: number;
  lost: number;
  rate: number;
}

/** Win rate grouped by SalesLeadSource - which channel actually converts, not just which channel produces the most volume. */
export async function getBestConvertingSource(): Promise<SourceConversion[]> {
  const [wonBySource, lostBySource] = await Promise.all([
    prisma.salesLead.groupBy({ by: ["source"], where: { status: "WON" }, _count: { source: true } }),
    prisma.salesLead.groupBy({ by: ["source"], where: { status: "LOST" }, _count: { source: true } }),
  ]);
  const lostMap = new Map(lostBySource.map((row) => [row.source, row._count.source]));

  return wonBySource
    .map((row) => {
      const won = row._count.source;
      const lost = lostMap.get(row.source) ?? 0;
      const total = won + lost;
      return { source: row.source, won, lost, rate: total > 0 ? won / total : 0 };
    })
    .sort((a, b) => b.rate - a.rate);
}

type WeightField =
  | "websiteQualityWeight"
  | "reviewRatingWeight"
  | "reviewCountWeight"
  | "hasWebsiteWeight"
  | "industryFitWeight"
  | "growthSignalsWeight"
  | "contactAvailabilityWeight";
const FACTOR_TO_WEIGHT_FIELD: Record<string, WeightField> = {
  websiteQuality: "websiteQualityWeight",
  reviewRating: "reviewRatingWeight",
  reviewCount: "reviewCountWeight",
  hasWebsite: "hasWebsiteWeight",
  industryFit: "industryFitWeight",
  growthSignals: "growthSignalsWeight",
  contactAvailability: "contactAvailabilityWeight",
};

function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) return null;
  return cov / Math.sqrt(varX * varY);
}

export interface WeightAdjustmentSuggestion {
  field: WeightField;
  currentValue: number;
  suggestedValue: number;
  rationale: string;
}

/**
 * Correlates each Opportunity Score factor's raw value against real
 * WON/LOST outcomes for promoted businesses - a simple point-biserial
 * correlation per factor, not a trained model. Purely advisory: returns
 * suggestions for a human to review and explicitly Apply on the
 * scoring-config admin page (updateLeadScoringConfig) - never
 * auto-applied. Below MIN_SAMPLE_FOR_TRUST promoted+resolved leads,
 * returns an empty list rather than a suggestion built on noise.
 */
export async function getSuggestedWeightAdjustments(config: LeadScoringConfig): Promise<WeightAdjustmentSuggestion[]> {
  const promoted = await prisma.business.findMany({
    where: { promotedSalesLeadId: { not: null } },
    select: {
      promotedSalesLead: { select: { status: true } },
      aiReports: { orderBy: { createdAt: "desc" }, take: 1, select: { scoreFactors: true } },
    },
  });

  const samples: { factors: Record<string, number>; won: number }[] = [];
  for (const business of promoted) {
    const status = business.promotedSalesLead?.status;
    if (status !== "WON" && status !== "LOST") continue;
    const report = business.aiReports[0];
    if (!report) continue;
    const factors = report.scoreFactors as unknown as { factor: string; rawValue: number }[];
    if (!Array.isArray(factors)) continue;
    const factorMap: Record<string, number> = {};
    for (const f of factors) factorMap[f.factor] = f.rawValue;
    samples.push({ factors: factorMap, won: status === "WON" ? 1 : 0 });
  }

  if (samples.length < MIN_SAMPLE_FOR_TRUST) return [];

  const suggestions: WeightAdjustmentSuggestion[] = [];
  for (const [factorName, weightField] of Object.entries(FACTOR_TO_WEIGHT_FIELD)) {
    const xs = samples.map((s) => s.factors[factorName] ?? 0);
    const ys = samples.map((s) => s.won);
    const correlation = pearsonCorrelation(xs, ys);
    if (correlation == null) continue;

    const currentValue = config[weightField];
    const delta = Math.round(correlation * 10);
    const suggestedValue = Math.max(0, Math.min(50, currentValue + delta));
    if (suggestedValue === currentValue) continue;

    suggestions.push({
      field: weightField,
      currentValue,
      suggestedValue,
      rationale: `Businesses with a higher "${factorName}" score converted ${correlation > 0 ? "more" : "less"} often (correlation ${correlation.toFixed(2)} across ${samples.length} promoted lead${samples.length === 1 ? "" : "s"}).`,
    });
  }
  return suggestions;
}
