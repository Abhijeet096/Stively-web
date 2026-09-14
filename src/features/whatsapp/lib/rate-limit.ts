/** Same daily-cap shape as AI_TUTOR_DAILY_MESSAGE_LIMIT (features/learning/lib/ai-tutor.ts) - protects Groq spend and abuse from a number spamming the webhook to burn API credits. Higher than the tutor's 20/day since a sales conversation naturally runs more turns than a single-lesson Q&A. */
export const WHATSAPP_AI_DAILY_MESSAGE_LIMIT = 40;

/** Number of past turns pulled into a reply's conversation-history context - same bounded-window idea as AI_TUTOR_HISTORY_TURNS, kept small since every extra turn costs prompt tokens on every subsequent reply. */
export const WHATSAPP_AI_HISTORY_TURNS = 12;

export function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
