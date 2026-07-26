import type { LeadScoringConfig } from "@prisma/client";

export interface ScoringInputs {
  websiteScore: number | null;
  hasWebsite: boolean;
  googleRating: number | null; // 0-5
  googleReviewCount: number | null;
  industry: string | null;
  industryConversionRate: number | null; // 0-1
  hasPhone: boolean;
  hasEmail: boolean;
  hasWhatsapp: boolean;
  socialProfileCount: number;
  growthSignals: { hasBlog: boolean; hasRecentContent: boolean };
}

export interface ScoreFactor {
  factor: string;
  weight: number;
  rawValue: number; // 0-1
  contribution: number;
}

export interface ScoringResult {
  opportunityScore: number;
  factors: ScoreFactor[];
}

function weighted(factor: string, weight: number, rawValue: number): ScoreFactor {
  const clamped = Math.min(1, Math.max(0, rawValue));
  return { factor, weight, rawValue: clamped, contribution: weight * clamped };
}

/**
 * Pure, deterministic, zero-I/O - reads weights from LeadScoringConfig
 * (never hardcoded, the SRS's explicit requirement) and returns a 0-100
 * score plus a per-factor breakdown that always sums to it, for
 * transparency. Unknown/missing inputs get a neutral default (e.g. an
 * unrated business scores 0.5, not 0) rather than being punished for data
 * this feature simply doesn't have yet. server/generate-report.ts is the
 * orchestrator that gathers real inputs and calls this.
 */
export function computeOpportunityScore(inputs: ScoringInputs, config: LeadScoringConfig): ScoringResult {
  const factors: ScoreFactor[] = [];

  const websiteQuality = inputs.websiteScore != null ? inputs.websiteScore / 100 : 0;
  factors.push(weighted("websiteQuality", config.websiteQualityWeight, websiteQuality));

  const reviewRating = inputs.googleRating != null ? inputs.googleRating / 5 : 0.5;
  factors.push(weighted("reviewRating", config.reviewRatingWeight, reviewRating));

  const reviewCount = inputs.googleReviewCount != null ? Math.min(inputs.googleReviewCount / 100, 1) : 0.3;
  factors.push(weighted("reviewCount", config.reviewCountWeight, reviewCount));

  factors.push(weighted("hasWebsite", config.hasWebsiteWeight, inputs.hasWebsite ? 1 : 0));

  const industryFit = inputs.industryConversionRate ?? 0.2;
  factors.push(weighted("industryFit", config.industryFitWeight, industryFit));

  const growth = (inputs.growthSignals.hasBlog ? 0.5 : 0) + (inputs.growthSignals.hasRecentContent ? 0.5 : 0);
  factors.push(weighted("growthSignals", config.growthSignalsWeight, growth));

  const contactAvailability = [inputs.hasPhone, inputs.hasEmail, inputs.hasWhatsapp].filter(Boolean).length / 3;
  factors.push(weighted("contactAvailability", config.contactAvailabilityWeight, contactAvailability));

  const opportunityScore = Math.round(Math.min(100, Math.max(0, factors.reduce((sum, f) => sum + f.contribution, 0))));

  return { opportunityScore, factors };
}
