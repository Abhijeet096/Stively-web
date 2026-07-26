import "server-only";

import type Groq from "groq-sdk";
import { z } from "zod";

import { groq, requestValidatedJson, DEFAULT_GROQ_MODEL } from "@/lib/groq";

export { groq };

/**
 * Llama 3.1 8B Instant on Groq - see src/lib/groq.ts's DEFAULT_GROQ_MODEL
 * comment on why this org account is limited to this model. Kept as its
 * own named export here (rather than importing DEFAULT_GROQ_MODEL
 * directly at call sites) since "the interview model" is a meaningful,
 * feature-specific name even though the underlying value is shared.
 */
export const INTERVIEW_MODEL = DEFAULT_GROQ_MODEL;

const turnSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Groq returned a blank message"),
  moveToNextCategory: z.boolean().default(false),
});

export type GroqTurnResult = z.infer<typeof turnSchema>;

/**
 * The one function InterviewEngine calls for each live conversational turn
 * - everything upstream (PromptService) builds messages and interprets the
 * result; nothing else in the codebase imports the Groq SDK directly, so
 * swapping voice/LLM providers later touches this file alone.
 */
export async function requestInterviewerTurn(
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[]
): Promise<GroqTurnResult> {
  return requestValidatedJson(messages, turnSchema, { model: INTERVIEW_MODEL, temperature: 0.8, maxTokens: 300 });
}

const evaluationSchema = z.object({
  overall: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  professionalism: z.number().min(0).max(100),
  salesSkills: z.number().min(0).max(100).nullable().default(null),
  problemSolving: z.number().min(0).max(100),
  leadershipPotential: z.number().min(0).max(100),
  learningAbility: z.number().min(0).max(100),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  suggestedTraining: z.array(z.string()).min(1),
  recommendation: z.enum(["STRONG_HIRE", "HIRE", "HOLD", "REJECT"]),
});

export type GroqEvaluationResult = z.infer<typeof evaluationSchema>;

/** The one function EvaluationService calls for the end-of-interview scoring pass. */
export async function requestInterviewEvaluation(
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[]
): Promise<GroqEvaluationResult> {
  return requestValidatedJson(messages, evaluationSchema, { model: INTERVIEW_MODEL, temperature: 0.3, maxTokens: 1200 });
}
