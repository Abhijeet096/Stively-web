import type { NarrativeContent, SolutionContent, DeliveryContent } from "../server/proposal-engine";
import type { RoiEstimate } from "../server/roi-calculator";

export interface ProposalPackageContent {
  id: string;
  name: string;
  /** Paise - always human-entered, never AI-produced. */
  priceAmount: number;
  whatsIncluded: string[];
}

export interface ProposalPaymentMilestoneContent {
  label: string;
  percent: number;
}

export interface ProposalCalculatorItemContent {
  id: string;
  label: string;
  /** Paise - always human-entered, never AI-produced, same discipline as ProposalPackageContent.priceAmount. */
  priceAmount: number;
  defaultSelected: boolean;
  description?: string | null;
}

/**
 * The alternative to fixed packages - the client toggles individual line
 * items and the price updates live. A proposal is in exactly one pricing
 * mode at a time, derived from which of packages/calculator.items is
 * non-empty (no separate mode flag - same "derive don't duplicate"
 * discipline as computeProposalReadiness).
 */
export interface ProposalCalculatorContent {
  items: ProposalCalculatorItemContent[];
  paymentMilestones: ProposalPaymentMilestoneContent[];
}

export interface ProposalOpportunityScoreContent {
  score: number;
  /** {factor, contribution}[] snapshot from the real AILeadReport.scoreFactors - never fabricated when the lead has no AILeadReport. */
  factors: { factor: string; contribution: number }[];
}

/**
 * The proposal's opening "AI Business Audit" - built in lib/business-audit.ts
 * from whichever real data exists for this lead (AILeadReport, then
 * BusinessWebsiteAnalysis, then the already-grounded problemsFound[] as a
 * last resort). overallScore is null (no badge rendered) rather than
 * fabricated when neither source exists.
 */
export interface ProposalBusinessAuditContent {
  overallScore: number | null;
  scoreSource: "OPPORTUNITY_SCORE" | "WEBSITE_SCORE" | null;
  biggestOpportunity: string | null;
  topImprovements: { title: string; detail: string | null }[];
}

/**
 * The whole structured document for one ProposalVersion.content. Narrative/
 * solution/delivery come straight from proposal-engine.ts's Groq calls.
 * packages/paymentMilestones/roiEstimate/opportunityScore are assembled
 * here in code - never inside the AI engine - so pricing, ROI, and scoring
 * can never be silently altered by a model call (see actions/
 * proposal-actions.ts).
 */
export interface ProposalContent {
  coverTagline: NarrativeContent["coverTagline"];
  executiveSummary: NarrativeContent["executiveSummary"];
  businessUnderstanding: NarrativeContent["businessUnderstanding"];
  problemsFound: NarrativeContent["problemsFound"];
  whyStively: NarrativeContent["whyStively"];
  faq: NarrativeContent["faq"];
  /** 3-5 current-state/future-state pairs, grounded in problemsFound and the real selected services. Empty if fewer than 2 real problems exist. */
  beforeAfterVision: NarrativeContent["beforeAfter"];
  proposedSolution: SolutionContent["proposedSolution"];
  featureBreakdown: SolutionContent["featureBreakdown"];
  /** Qualitative outcomes only (visibility, speed, trust, etc.) - never a number or revenue figure; that's the separate human-entered ROI calculator below. */
  estimatedImpact: SolutionContent["expectedImpact"];
  timeline: DeliveryContent["timeline"];
  deliverables: DeliveryContent["deliverables"];
  /** Empty until the salesperson sets pricing via updatePackagesAndPricing. Mutually exclusive with calculator - see ProposalCalculatorContent's comment. */
  packages: ProposalPackageContent[];
  paymentMilestones: ProposalPaymentMilestoneContent[];
  /** Null until the salesperson sets an interactive calculator via updateCalculatorPricing. */
  calculator: ProposalCalculatorContent | null;
  /** Null unless the salesperson entered real ROI assumptions. */
  roiEstimate: RoiEstimate | null;
  /** Null unless this lead has a real AILeadReport (came from a promoted Business). */
  opportunityScore: ProposalOpportunityScoreContent | null;
  /** Null if no real data exists to ground an audit at all (see lib/business-audit.ts's fallback chain). */
  businessAudit: ProposalBusinessAuditContent | null;
}
