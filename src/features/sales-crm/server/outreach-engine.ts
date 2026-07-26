import "server-only";

import { z } from "zod";
import type Groq from "groq-sdk";

import { requestValidatedJson, DEFAULT_GROQ_MODEL } from "@/lib/groq";

const outreachContentSchema = z.object({
  whatsappMessage: z.string().trim().min(1),
  emailSubject: z.string().trim().min(1),
  emailBody: z.string().trim().min(1),
  coldCallScript: z.string().trim().min(1),
  /// Always requested from the model - whether it's actually usable
  /// (a real named contact exists) is enforced deterministically by the
  /// caller (see outreach-actions.ts), not left to the model's judgment.
  linkedinMessage: z.string().trim().min(1),
});

export type OutreachContent = z.infer<typeof outreachContentSchema>;

/**
 * The one Groq call for outreach generation - all four channels together,
 * grounded in whatever outreach-prompt-service.ts built from the real
 * SalesLead. Same JSON-mode/Zod-validated/retry-3x machinery every other
 * Groq call in this codebase uses (src/lib/groq.ts).
 */
export async function requestOutreachContent(messages: Groq.Chat.Completions.ChatCompletionMessageParam[]): Promise<OutreachContent> {
  return requestValidatedJson(messages, outreachContentSchema, { model: DEFAULT_GROQ_MODEL, temperature: 0.6, maxTokens: 1100 });
}
