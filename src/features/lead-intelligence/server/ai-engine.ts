import "server-only";

import { z } from "zod";
import type Groq from "groq-sdk";

import { requestValidatedJson, DEFAULT_GROQ_MODEL } from "@/lib/groq";

const businessIntelligenceSchema = z.object({
  summary: z.string().trim().min(1),
  recommendations: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().trim().min(1),
        priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
        category: z.enum(["WEBSITE", "SOCIAL", "OUTREACH", "SEO", "GENERAL"]),
      })
    )
    .min(1),
  suggestedOutreachMessage: z.string().trim().min(1),
});

export type AIBusinessIntelligenceResult = z.infer<typeof businessIntelligenceSchema>;

/**
 * The one Groq call for report generation - summary + recommendations +
 * outreach message together, grounded in whatever prompt-service.ts built
 * from real analyzed data. Same JSON-mode/Zod-validated/retry-3x machinery
 * every other Groq call in this codebase uses (src/lib/groq.ts).
 */
export async function requestBusinessIntelligence(
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[]
): Promise<AIBusinessIntelligenceResult> {
  return requestValidatedJson(messages, businessIntelligenceSchema, { model: DEFAULT_GROQ_MODEL, temperature: 0.4, maxTokens: 900 });
}
