import type { CheckResult } from "./checks/types";

export interface AnalysisChecks {
  security: CheckResult;
  seo: CheckResult;
  performance: CheckResult;
  business: CheckResult;
  content: CheckResult;
  growthSignals: { hasBlog: boolean; hasRecentContent: boolean };
}

export interface AnalysisScores {
  securityScore: number;
  seoScore: number;
  performanceScore: number;
  contentScore: number;
  /**
   * Average across all five check categories, including `business` - which
   * has no dedicated scalar column on BusinessWebsiteAnalysis (the schema
   * only reserves four), but its findings are still fully visible in the
   * persisted `checks` JSON and still count toward the overall picture.
   */
  overallScore: number;
}

export function computeAnalysisScores(checks: AnalysisChecks): AnalysisScores {
  const securityScore = checks.security.score;
  const seoScore = checks.seo.score;
  const performanceScore = checks.performance.score;
  const contentScore = checks.content.score;
  const businessScore = checks.business.score;

  const overallScore = Math.round((securityScore + seoScore + performanceScore + contentScore + businessScore) / 5);

  return { securityScore, seoScore, performanceScore, contentScore, overallScore };
}
