import type { AILeadReport, BusinessWebsiteAnalysis } from "@prisma/client";
import type { AnalysisChecks } from "@/features/lead-intelligence/analyzer/scoring";

import type { ProposalBusinessAuditContent } from "./content-types";

interface AIRecommendation {
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string;
}

const PRIORITY_RANK: Record<AIRecommendation["priority"], number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const MAX_DETAIL_LENGTH = 100;

/**
 * CheckFinding.detail is built for the internal Lead Intelligence dashboard
 * (see seo-checks.ts etc.) - some checks stuff the raw scraped page text in
 * there (e.g. the actual <meta description> content) rather than a short
 * explanation, and a missing value is spelled out as the literal string
 * "missing". Never surface either verbatim on a real client-facing
 * proposal page - truncate long scraped text and drop placeholder words.
 */
function sanitizeCheckDetail(detail: string | undefined): string | null {
  if (!detail) return null;
  const trimmed = detail.trim();
  if (!trimmed || trimmed.toLowerCase() === "missing") return null;
  return trimmed.length > MAX_DETAIL_LENGTH ? `${trimmed.slice(0, MAX_DETAIL_LENGTH).trimEnd()}…` : trimmed;
}

interface NarrativeProblem {
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * Pure, zero-I/O - no `server-only`, same convention as ./readiness.ts, so
 * this can be imported anywhere without pulling in Prisma access. Builds the
 * proposal's opening "AI Business Audit" from whichever real data actually
 * exists for this lead, in order of preference - never fabricates a score or
 * an improvement not grounded in something real. Most leads today have
 * neither an AILeadReport nor a BusinessWebsiteAnalysis (manually entered,
 * never run through Lead Intelligence), so the problemsFound fallback is the
 * common path, not an edge case.
 */
export function buildBusinessAudit(params: {
  aiReport: AILeadReport | null;
  websiteAnalysis: BusinessWebsiteAnalysis | null;
  problemsFound: NarrativeProblem[];
}): ProposalBusinessAuditContent | null {
  const { aiReport, websiteAnalysis, problemsFound } = params;

  if (aiReport) {
    const recommendations = (aiReport.recommendations as unknown as AIRecommendation[] | null) ?? [];
    if (recommendations.length > 0) {
      const sorted = [...recommendations].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
      const top = sorted[0];
      return {
        overallScore: aiReport.opportunityScore,
        scoreSource: "OPPORTUNITY_SCORE",
        biggestOpportunity: `${top.title} — ${top.description}`,
        topImprovements: sorted.slice(0, 5).map((r) => ({ title: r.title, detail: r.description })),
      };
    }
  }

  if (websiteAnalysis && websiteAnalysis.status === "COMPLETE" && websiteAnalysis.overallScore != null) {
    const subScores: { key: string; label: string; score: number }[] = [
      { key: "security", label: "your website's security", score: websiteAnalysis.securityScore ?? 100 },
      { key: "seo", label: "your search visibility", score: websiteAnalysis.seoScore ?? 100 },
      { key: "performance", label: "your website's speed", score: websiteAnalysis.performanceScore ?? 100 },
      { key: "content", label: "your website's content", score: websiteAnalysis.contentScore ?? 100 },
    ];
    const weakest = subScores.reduce((a, b) => (b.score < a.score ? b : a));

    const checks = websiteAnalysis.checks as unknown as AnalysisChecks | null;
    const failedFindings = checks
      ? Object.values(checks)
          .filter((v): v is { score: number; findings: { label: string; passed: boolean; detail?: string }[] } => Array.isArray((v as { findings?: unknown })?.findings))
          .flatMap((v) => v.findings)
          .filter((f) => !f.passed)
      : [];

    return {
      overallScore: websiteAnalysis.overallScore,
      scoreSource: "WEBSITE_SCORE",
      biggestOpportunity: `The biggest opportunity we found is improving ${weakest.label} (currently scoring ${weakest.score}/100).`,
      topImprovements:
        failedFindings.length > 0
          ? failedFindings.slice(0, 5).map((f) => ({ title: f.label, detail: sanitizeCheckDetail(f.detail) }))
          : subScores
              .filter((s) => s.score < 100)
              .sort((a, b) => a.score - b.score)
              .slice(0, 5)
              .map((s) => ({ title: `Improve ${s.label}`, detail: `Currently scoring ${s.score}/100.` })),
    };
  }

  if (problemsFound.length > 0) {
    const sorted = [...problemsFound].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    const top = sorted[0];
    return {
      overallScore: null,
      scoreSource: null,
      biggestOpportunity: `${top.title} — ${top.description}`,
      topImprovements: sorted.slice(0, 5).map((p) => ({ title: p.title, detail: p.description })),
    };
  }

  return null;
}
