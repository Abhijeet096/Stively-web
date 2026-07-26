import "server-only";

import { z } from "zod";

import { requestValidatedJson, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import {
  buildNarrativeMessages,
  buildSolutionMessages,
  buildDeliveryMessages,
  type ProposalGenerationContext,
} from "./proposal-prompt-service";

const narrativeSchema = z.object({
  coverTagline: z.string().trim().min(1),
  executiveSummary: z.string().trim().min(1),
  businessUnderstanding: z.string().trim().min(1),
  problemsFound: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().trim().min(1),
        priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
        category: z.enum(["WEBSITE", "SECURITY", "SEO", "PERFORMANCE", "CONTENT", "MARKETING", "OPERATIONS", "GENERAL"]),
      })
    )
    .default([]),
  whyStively: z.string().trim().min(1),
  faq: z.array(z.object({ question: z.string().trim().min(1), answer: z.string().trim().min(1) })).default([]),
  beforeAfter: z.array(z.object({ from: z.string().trim().min(1), to: z.string().trim().min(1) })).default([]),
});

const solutionSchema = z.object({
  proposedSolution: z
    .array(
      z.object({
        offeringId: z.string().trim().min(1),
        title: z.string().trim().min(1),
        description: z.string().trim().min(1),
        benefits: z.array(z.string().trim().min(1)).default([]),
        expectedOutcome: z.string().trim().min(1),
      })
    )
    .default([]),
  featureBreakdown: z.array(z.object({ title: z.string().trim().min(1), description: z.string().trim().min(1) })).default([]),
  expectedImpact: z.array(z.object({ label: z.string().trim().min(1), description: z.string().trim().min(1) })).default([]),
});

const deliverySchema = z.object({
  timeline: z
    .array(z.object({ stage: z.string().trim().min(1), label: z.string().trim().min(1), description: z.string().trim().min(1) }))
    .default([]),
  deliverables: z.array(z.object({ title: z.string().trim().min(1), description: z.string().trim().min(1) })).default([]),
});

export type NarrativeContent = z.infer<typeof narrativeSchema>;
export type SolutionContent = z.infer<typeof solutionSchema>;
export type DeliveryContent = z.infer<typeof deliverySchema>;

export interface GeneratedProposalNarrative {
  narrative: NarrativeContent;
  solution: SolutionContent;
  delivery: DeliveryContent;
  modelUsed: string;
}

/**
 * Three narrowly-scoped, grounded Groq calls run in parallel - not one
 * giant call (risks max_tokens truncation -> invalid JSON on the 8B model
 * this org is limited to) and not one-per-section (excessive latency for a
 * single button click). See proposal-prompt-service.ts for what each call
 * is grounded in. Pricing/packages/payment-schedule/ROI are deliberately
 * NOT produced here - those are salesperson-entered/computed, assembled
 * separately by the caller (actions/proposal-actions.ts).
 */
export async function generateProposalNarrative(ctx: ProposalGenerationContext): Promise<GeneratedProposalNarrative> {
  const [narrative, solution, delivery] = await Promise.all([
    requestValidatedJson(buildNarrativeMessages(ctx), narrativeSchema, { model: DEFAULT_GROQ_MODEL, temperature: 0.5, maxTokens: 1700 }),
    requestValidatedJson(buildSolutionMessages(ctx), solutionSchema, { model: DEFAULT_GROQ_MODEL, temperature: 0.4, maxTokens: 1500 }),
    requestValidatedJson(buildDeliveryMessages(ctx), deliverySchema, { model: DEFAULT_GROQ_MODEL, temperature: 0.4, maxTokens: 1000 }),
  ]);

  return { narrative, solution, delivery, modelUsed: DEFAULT_GROQ_MODEL };
}
