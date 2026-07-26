import "server-only";

import type Groq from "groq-sdk";
import type { Business, BusinessWebsiteAnalysis, SocialProfile } from "@prisma/client";

import type { ScoreFactor } from "./scoring-engine";

const PERSONA_RULES = `You are Stively's AI Lead Intelligence analyst. Stively is a software development company offering website development, web applications, CRM development, AI automation, SEO, digital marketing, branding, and cloud solutions.

Hard rules, no exceptions:
- Base every claim ONLY on the data provided below. Never invent facts about the business (no fabricated employee counts, revenue, founding dates, or anything not given to you).
- If a piece of data is missing (e.g. no website, no rating), say so honestly rather than guessing.
- Be specific and concrete, not generic marketing filler. Reference the actual scores/signals given.
- The outreach message must be genuinely personalized using only the real data provided - never a generic template with the business name swapped in.
- Recommend only from Stively's real service list above; never invent a service Stively doesn't offer.`;

const RESPONSE_FORMAT_RULES = `Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "summary": "2-4 sentence plain-language summary of this business and why it is or isn't a good prospect for Stively",
  "recommendations": [
    { "title": "short recommendation title", "description": "1-2 sentences explaining why, grounded in the real data", "priority": "HIGH" | "MEDIUM" | "LOW", "category": "WEBSITE" | "SOCIAL" | "OUTREACH" | "SEO" | "GENERAL" }
  ],
  "suggestedOutreachMessage": "a short, ready-to-send opening message a salesperson could send this business, referencing something specific and real about them"
}
Include 2-5 recommendations, ordered by priority.`;

function formatWebsiteAnalysis(analysis: BusinessWebsiteAnalysis | null): string {
  if (!analysis) return "No website analysis available.";
  if (analysis.status !== "COMPLETE") return `Website analysis status: ${analysis.status}${analysis.errorMessage ? ` (${analysis.errorMessage})` : ""}.`;
  return [
    `Website: ${analysis.url}`,
    `Overall website score: ${analysis.overallScore}/100`,
    `Security: ${analysis.securityScore}/100, SEO: ${analysis.seoScore}/100, Performance (proxy): ${analysis.performanceScore}/100, Content: ${analysis.contentScore}/100`,
  ].join("\n");
}

function formatSocialProfiles(profiles: SocialProfile[]): string {
  if (profiles.length === 0) return "No social media presence detected.";
  return profiles.map((p) => `${p.platform}: ${p.url}`).join(", ");
}

function formatScoreFactors(factors: ScoreFactor[]): string {
  return factors.map((f) => `${f.factor}: weight ${f.weight}, raw ${f.rawValue.toFixed(2)}, contributed ${f.contribution.toFixed(1)} pts`).join("\n");
}

/**
 * Builds the single combined message array for generateBusinessIntelligence
 * - one Groq call produces the summary, recommendations, and outreach
 * message together (same "single comprehensive pass" discipline as the
 * interview evaluator), grounded strictly in the real inputs assembled
 * below by server/generate-report.ts. Never called from a component.
 */
export function buildBusinessIntelligenceMessages(input: {
  business: Business;
  opportunityScore: number;
  scoreFactors: ScoreFactor[];
  websiteAnalysis: BusinessWebsiteAnalysis | null;
  socialProfiles: SocialProfile[];
}): Groq.Chat.Completions.ChatCompletionMessageParam[] {
  const { business, opportunityScore, scoreFactors, websiteAnalysis, socialProfiles } = input;

  const businessSummary = [
    `Business name: ${business.businessName}`,
    business.industry ? `Industry: ${business.industry}` : "Industry: unknown",
    business.city || business.state ? `Location: ${[business.city, business.state, business.country].filter(Boolean).join(", ")}` : `Country: ${business.country}`,
    business.website ? `Website: ${business.website}` : "Has no website on file",
    business.googleRating != null ? `Google rating: ${business.googleRating}/5 from ${business.googleReviewCount ?? 0} reviews` : "No Google rating data",
    `Phone on file: ${business.phone ? "yes" : "no"}, Email on file: ${business.email ? "yes" : "no"}, WhatsApp on file: ${business.whatsapp ? "yes" : "no"}`,
  ].join("\n");

  const userContent = [
    businessSummary,
    "",
    "Website analysis:",
    formatWebsiteAnalysis(websiteAnalysis),
    "",
    "Social presence:",
    formatSocialProfiles(socialProfiles),
    "",
    `Opportunity score: ${opportunityScore}/100`,
    "Score breakdown:",
    formatScoreFactors(scoreFactors),
    "",
    RESPONSE_FORMAT_RULES,
  ].join("\n");

  return [
    { role: "system", content: PERSONA_RULES },
    { role: "user", content: userContent },
  ];
}
