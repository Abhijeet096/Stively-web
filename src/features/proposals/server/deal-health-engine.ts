import "server-only";

import { z } from "zod";
import type Groq from "groq-sdk";

import { requestValidatedJson, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import type { DealHealthLevel } from "../lib/deal-health";

const PERSONA_RULES = `You are a Stively salesperson drafting a short, warm follow-up message to a prospect who received a real proposal. Ground everything only in the real facts given below - never invent urgency ("last chance", "offer expires"), never invent a discount or price, never invent a fact not given. Keep it 2-4 sentences, friendly and low-pressure, written to be sent as-is (or lightly edited) over WhatsApp or email. Never say you are an AI.`;

const messageSchema = z.object({ message: z.string().trim().min(1, "Groq returned a blank message") });

/**
 * One small, explicit, button-triggered call - never scheduled/automatic.
 * Returns a draft for the salesperson to review, edit, and send themselves;
 * this codebase never lets AI send a message on the salesperson's behalf
 * (same "a human decides" precedent as rejectProposal never auto-setting a
 * lost reason).
 */
export async function generateFollowUpMessage(params: {
  businessName: string;
  proposalTitle: string;
  level: DealHealthLevel;
  daysSinceLastActivity: number | null;
  viewCount: number;
}): Promise<string> {
  const facts = [
    `Business: ${params.businessName}`,
    `Proposal: ${params.proposalTitle}`,
    params.viewCount > 0 ? `They've viewed the proposal ${params.viewCount} time(s).` : "They haven't opened the proposal yet.",
    params.daysSinceLastActivity != null ? `${params.daysSinceLastActivity} days since last activity.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: PERSONA_RULES },
    { role: "user", content: `${facts}\n\nRespond with ONLY a JSON object, no other text: {"message": "your short follow-up message"}` },
  ];

  const result = await requestValidatedJson(messages, messageSchema, { model: DEFAULT_GROQ_MODEL, temperature: 0.6, maxTokens: 300 });
  return result.message;
}
