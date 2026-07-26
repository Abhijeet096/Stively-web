import "server-only";

import type Groq from "groq-sdk";
import type { SalesLead, SalesLeadDiscovery, Business, BusinessWebsiteAnalysis, AILeadReport } from "@prisma/client";

const PERSONA_RULES = `You are Stively's AI Proposal writer. Stively is a software development company offering website development, web applications, CRM development, AI automation, SEO, digital marketing, branding, and cloud solutions.

Hard rules, no exceptions:
- Base every claim ONLY on the real data provided below. Never invent facts about the business (no fabricated employee counts, revenue, founding dates, competitor names, or anything not given to you).
- Never invent or suggest prices, discounts, or dates - those come from the salesperson separately, never from you.
- If a piece of data is missing, either omit that detail or say so honestly - never guess or pad with generic filler.
- Write like a real proposal prepared specifically for this client, not a template with the name swapped in - reference their actual industry, location, and what was actually discussed.
- Recommend only Stively's real services listed above; never invent a service Stively doesn't offer.
- Your entire response must be a single JSON object matching the exact shape given - never a JSON array at the top level, even if a field inside that object is itself a list.`;

function formatBusinessContext(params: {
  salesLead: SalesLead;
  discovery: SalesLeadDiscovery;
  recentNotes: string[];
  business: Business | null;
  websiteAnalysis: BusinessWebsiteAnalysis | null;
  aiReport: AILeadReport | null;
}): string {
  const { salesLead, discovery, recentNotes, business, websiteAnalysis, aiReport } = params;

  const lines = [
    `Business name: ${salesLead.businessName}`,
    salesLead.industry ? `Industry: ${salesLead.industry}` : "Industry: unknown",
    `Location: ${[salesLead.city, salesLead.state, salesLead.country].filter(Boolean).join(", ")}`,
    salesLead.website ? `Website: ${salesLead.website}` : "Has no website on file",
    "",
    "--- Discovery notes (from the salesperson) ---",
    discovery.requirementsNotes ? `Requirements: ${discovery.requirementsNotes}` : "Requirements: not detailed",
    discovery.painPoints ? `Pain points observed by salesperson: ${discovery.painPoints}` : "",
    discovery.timelineExpectation ? `Timeline expectation: ${discovery.timelineExpectation}` : "",
    discovery.decisionMakerName ? `Decision maker: ${discovery.decisionMakerName}${discovery.decisionMakerRole ? ` (${discovery.decisionMakerRole})` : ""}` : "",
    discovery.customServiceNotes ? `Custom/add-on requests: ${discovery.customServiceNotes}` : "",
  ];

  if (recentNotes.length > 0) {
    lines.push("", "--- Recent CRM notes ---", ...recentNotes.map((n, i) => `${i + 1}. ${n}`));
  }

  if (business) {
    lines.push(
      "",
      "--- This lead came from a discovered business (AI Lead Intelligence) ---",
      business.googleRating != null ? `Google rating: ${business.googleRating}/5 from ${business.googleReviewCount ?? 0} reviews` : ""
    );
  }

  if (websiteAnalysis && websiteAnalysis.status === "COMPLETE") {
    lines.push(
      "",
      "--- Website analysis (real, automated) ---",
      `Overall score: ${websiteAnalysis.overallScore}/100`,
      `Security: ${websiteAnalysis.securityScore}/100, SEO: ${websiteAnalysis.seoScore}/100, Performance (proxy): ${websiteAnalysis.performanceScore}/100, Content: ${websiteAnalysis.contentScore}/100`
    );
  }

  if (aiReport) {
    lines.push("", "--- Prior AI business analysis ---", aiReport.summary);
  }

  return lines.filter(Boolean).join("\n");
}

function formatCopilotInstruction(copilotInstruction: string | undefined, priorSummary: string | undefined): string {
  if (!copilotInstruction) return "";
  return [
    "",
    "--- Salesperson's update instruction (incorporate this into the content below) ---",
    copilotInstruction,
    priorSummary ? `\nPrevious executive summary, for continuity (update it, don't ignore it): ${priorSummary}` : "",
  ].join("\n");
}

export interface ProposalGenerationContext {
  salesLead: SalesLead;
  discovery: SalesLeadDiscovery;
  recentNotes: string[];
  business: Business | null;
  websiteAnalysis: BusinessWebsiteAnalysis | null;
  aiReport: AILeadReport | null;
  selectedOfferings: { id: string; title: string; shortDescription: string }[];
  /** Set only for AI_COPILOT_UPDATE regenerations. */
  copilotInstruction?: string;
  /** Prior version's executive summary, passed back in for copilot continuity. */
  priorExecutiveSummary?: string;
}

const NARRATIVE_FORMAT_RULES = `Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "coverTagline": "one short punchy line for the proposal cover, specific to this business (not generic)",
  "executiveSummary": "2-4 sentence personalized opening - thank them for their time, reference what was actually discussed, no template language",
  "businessUnderstanding": "2-4 sentences showing you understand their business, strengths, and current situation, grounded only in the real data given",
  "problemsFound": [{ "title": "short problem title", "description": "1-2 sentences, grounded in real data (discovery notes and/or website analysis) - never invent a problem not supported by the data", "priority": "HIGH" | "MEDIUM" | "LOW", "category": "WEBSITE" | "SECURITY" | "SEO" | "PERFORMANCE" | "CONTENT" | "MARKETING" | "OPERATIONS" | "GENERAL" }],
  "whyStively": "2-3 sentences on why Stively specifically, professional not exaggerated - mention real things like development process, support, and communication, no fake statistics",
  "faq": [{ "question": "a question this client would realistically ask", "answer": "a short honest answer" }],
  "beforeAfter": [{ "from": "a short phrase naming a real current problem/gap (grounded only in problemsFound/discovery/website analysis, never invented)", "to": "a short phrase naming the real future state Stively's selected services below will deliver - grounded only in the services actually selected, never invent a capability" }]
}
Include 2-5 items in problemsFound (only ones genuinely supported by the data - it is fine to include fewer if little data is available) and 3-6 items in faq. Include 3-5 beforeAfter pairs ONLY if there are at least 2 real problems to pair against - return an empty array otherwise, never pad with invented pairs.`;

export function buildNarrativeMessages(ctx: ProposalGenerationContext): Groq.Chat.Completions.ChatCompletionMessageParam[] {
  const servicesList = ctx.selectedOfferings.length
    ? ctx.selectedOfferings.map((o) => `- ${o.title}`).join("\n")
    : "No catalog services selected - base beforeAfter's \"to\" only on the custom/add-on requests in the discovery notes, or omit beforeAfter entirely if there's nothing concrete to point to.";

  const userContent = [
    formatBusinessContext(ctx),
    "",
    "--- Services selected for this proposal (ground beforeAfter's \"to\" in these) ---",
    servicesList,
    formatCopilotInstruction(ctx.copilotInstruction, ctx.priorExecutiveSummary),
    "",
    NARRATIVE_FORMAT_RULES,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: PERSONA_RULES },
    { role: "user", content: userContent },
  ];
}

const SOLUTION_FORMAT_RULES = `Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "proposedSolution": [{ "offeringId": "the exact id from the services list below", "title": "the offering's title", "description": "1-2 sentences on what this includes for this specific client", "benefits": ["short benefit phrase", "short benefit phrase"], "expectedOutcome": "1 sentence on the realistic expected outcome - no invented numbers" }],
  "featureBreakdown": [{ "title": "specific feature name", "description": "1 short sentence explaining it" }],
  "expectedImpact": [{ "label": "a short qualitative outcome type, e.g. \"Better Google Visibility\", \"Faster Customer Enquiries\", \"Stronger Brand Trust\", \"Easier Lead Management\"", "description": "1 short sentence on how the selected services realistically produce this outcome" }]
}
One proposedSolution entry per service listed below (use the exact offeringId given, never invent one). featureBreakdown should list 4-10 concrete features drawn from the selected services and any custom/add-on requests - never generic filler features not tied to something requested. expectedImpact must list 3-5 QUALITATIVE outcomes only - never a number, percentage, revenue figure, or timeframe of any kind (that is a separate human-entered ROI calculator, not your job); if you cannot ground a qualitative outcome in the selected services, omit it rather than pad the list.`;

export function buildSolutionMessages(ctx: ProposalGenerationContext): Groq.Chat.Completions.ChatCompletionMessageParam[] {
  const servicesList = ctx.selectedOfferings.length
    ? ctx.selectedOfferings.map((o) => `- id: ${o.id} | ${o.title} - ${o.shortDescription}`).join("\n")
    : "No catalog services selected - base the solution only on the custom/add-on requests in the discovery notes below.";

  const userContent = [
    formatBusinessContext(ctx),
    "",
    "--- Services selected for this proposal ---",
    servicesList,
    formatCopilotInstruction(ctx.copilotInstruction, undefined),
    "",
    SOLUTION_FORMAT_RULES,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: PERSONA_RULES },
    { role: "user", content: userContent },
  ];
}

const DELIVERY_FORMAT_RULES = `Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "timeline": [{ "stage": "short stage name, e.g. Planning", "label": "e.g. Week 1", "description": "1 short sentence on what happens in this stage" }],
  "deliverables": [{ "title": "short deliverable name", "description": "1 short sentence" }]
}
Include 4-8 timeline stages in chronological order (Planning through Deployment/Support) with realistic relative labels (Week 1, Week 2, ...) based on the timeline expectation given if any, otherwise a reasonable default pace. Include 5-12 deliverables, grounded in the services/features actually being built - never generic filler.`;

export function buildDeliveryMessages(ctx: ProposalGenerationContext): Groq.Chat.Completions.ChatCompletionMessageParam[] {
  const servicesList = ctx.selectedOfferings.length
    ? ctx.selectedOfferings.map((o) => `- ${o.title}`).join("\n")
    : "No catalog services selected - base delivery only on the custom/add-on requests below.";

  const userContent = [
    formatBusinessContext(ctx),
    "",
    "--- Services being delivered ---",
    servicesList,
    formatCopilotInstruction(ctx.copilotInstruction, undefined),
    "",
    DELIVERY_FORMAT_RULES,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: PERSONA_RULES },
    { role: "user", content: userContent },
  ];
}
