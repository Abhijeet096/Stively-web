import "server-only";

import Groq from "groq-sdk";
import { z } from "zod";

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set - Groq-backed features will fail to generate content.");
}

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * The one small/instant model every feature on this Groq org account can
 * actually use - larger models (including Llama 3.3 70B) are blocked at
 * the org level and return 403 model_permission_blocked_org (confirmed
 * live against console.groq.com). Callers can override via
 * requestValidatedJson's `options.model` once the org enables something
 * bigger, but this is the safe default for any new feature.
 */
export const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

const MAX_ATTEMPTS = 3;

/**
 * Every Groq call in this codebase goes through this: call the model in
 * JSON mode, validate the result against a Zod schema, retry a few times
 * on a blank/malformed/schema-invalid response before giving up. Shared
 * across features (originally built for the AI Interview Platform, now
 * also used by the AI Lead Intelligence Platform) rather than duplicated -
 * see src/features/interviews/server/groq-client.ts, which re-exports this
 * and keeps only its own interview-specific schemas/functions.
 */
export async function requestValidatedJson<T>(
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
  schema: z.ZodType<T>,
  options?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: options?.model ?? DEFAULT_GROQ_MODEL,
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
