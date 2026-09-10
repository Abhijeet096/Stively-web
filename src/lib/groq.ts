import "server-only";

import Groq from "groq-sdk";
import { z } from "zod";

/**
 * Lazily constructed, not a module-level singleton - the Groq SDK's
 * constructor throws synchronously when apiKey is empty, which would crash
 * on import alone (e.g. during Next's build-time page-data collection for
 * any page that transitively imports this file) before any feature even
 * needs Groq. Same reasoning/precedent as src/lib/razorpay.ts's
 * getRazorpayClient(). Deferring construction to first real use means the
 * app/build succeeds fine with no key configured yet, and only an actual
 * attempt to call Groq fails (caught by requestValidatedJson's callers).
 */
let client: Groq | null = null;

function getGroqClient(): Groq {
  if (!client) {
    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY is not set - Groq-backed features will fail to generate content.");
    }
    client = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
  }
  return client;
}

/**
 * 2026-08-18: llama-3.1-8b-instant (the previous default) was fully
 * deprecated by Groq (404 model_not_found, not just org-blocked) - every
 * other model on this org's account was also confirmed blocked at the org
 * level (model_permission_blocked_org) except this one, which the org admin
 * explicitly enabled at console.groq.com/settings/limits for exactly this
 * reason. Callers can override via requestValidatedJson's `options.model`
 * once the org enables something else, but this is the safe default for
 * any new feature - re-verify against console.groq.com's Allowed Models
 * list before assuming any other model ID works.
 */
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

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
      const completion = await getGroqClient().chat.completions.create({
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
