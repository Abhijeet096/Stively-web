/**
 * Account-wide, not per-lesson - a student asking 20 questions spread
 * across 5 lessons is the same real cost as 20 on one lesson, and a
 * per-lesson cap would just push someone to spread abuse across lessons
 * instead of preventing it. 20/day is generous for genuine lesson
 * questions and bounded enough to keep Groq usage predictable. Shared
 * between ai-tutor-actions.ts (enforcement) and queries.ts (display) so
 * the two can never drift out of sync.
 */
export const AI_TUTOR_DAILY_MESSAGE_LIMIT = 20;

/** Turns of prior conversation on a lesson included as context for a follow-up question - capped so a long conversation doesn't grow token cost unbounded per message. */
export const AI_TUTOR_HISTORY_TURNS = 6;

export function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
