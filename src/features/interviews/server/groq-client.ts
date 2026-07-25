import "server-only";

import Groq from "groq-sdk";
import { z } from "zod";

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set - the interview engine will fail to generate questions.");
}

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Llama 3.1 8B Instant on Groq - confirmed against this account's actual
 * Groq org permissions (larger models, including 3.3 70B, are blocked at
 * the org level and return 403 model_permission_blocked_org; verified live
 * against console.groq.com). Fast, and reliably follows the JSON-mode
 * response format and persona rules once given the full system prompt.
 * The one place a model name lives, so upgrading it later - once the org
 * enables a larger model - is a one-line change.
 */
export const INTERVIEW_MODEL = "llama-3.1-8b-instant";

const MAX_ATTEMPTS = 3;

/**
 * Every Groq call in this codebase - the live conversational turn and the
 * end-of-interview evaluation - goes through this: call the model in JSON
 * mode, validate the result against a Zod schema, retry a few times on a
 * blank/malformed/schema-invalid response before giving up. A live
 * candidate (or a report a recruiter will actually read) is a much worse
 * place to surface an occasional bad response from a small, fast model
 * than one extra ~1s round trip.
 */
async function requestValidatedJson<T>(
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
  schema: z.ZodType<T>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: INTERVIEW_MODEL,
        messages,
        response_format: { type: "json_object" },
        temperature: options?.temperature ?? 0.8,
        max_tokens: options?.maxTokens ?? 300,
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Groq returned an empty response");

      const parsed = JSON.parse(raw);
      return schema.parse(parsed);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Groq request failed after retries");
}

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
  return requestValidatedJson(messages, turnSchema, { temperature: 0.8, maxTokens: 300 });
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
  return requestValidatedJson(messages, evaluationSchema, { temperature: 0.3, maxTokens: 1200 });
}
