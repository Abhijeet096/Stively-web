import "server-only";

import { prisma } from "@/lib/prisma";

// A real candidate's natural cadence (speak, think, wait for the AI, speak
// again) is nowhere close to this - it exists purely to blunt a leaked link
// being hammered in a tight loop against a paid Groq call per turn.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;

/**
 * Fixed-window rate limit shared by the two public, unauthenticated
 * candidate actions (startInterview, submitInterviewTurn) - keyed on the
 * InterviewLink row since both actions resolve one before doing anything
 * else. Stored on the DB, not in-memory, so it holds up across multiple
 * serverless function instances. Not perfectly atomic under true concurrent
 * requests - fine for abuse deterrence, not meant to be billing-precise.
 */
export async function checkRateLimit(linkId: string): Promise<boolean> {
  const now = new Date();
  const link = await prisma.interviewLink.findUnique({
    where: { id: linkId },
    select: { rateLimitWindowStart: true, rateLimitCount: true },
  });
  if (!link) return false;

  const windowActive = link.rateLimitWindowStart && now.getTime() - link.rateLimitWindowStart.getTime() < WINDOW_MS;

  if (!windowActive) {
    await prisma.interviewLink.update({
      where: { id: linkId },
      data: { rateLimitWindowStart: now, rateLimitCount: 1 },
    });
    return true;
  }

  if (link.rateLimitCount >= MAX_REQUESTS_PER_WINDOW) return false;

  await prisma.interviewLink.update({
    where: { id: linkId },
    data: { rateLimitCount: { increment: 1 } },
  });
  return true;
}
