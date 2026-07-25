import "server-only";

import type { InterviewCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requestInterviewerTurn } from "./groq-client";
import { buildInterviewMessages, responsesToTranscript } from "./prompt-service";
import { generateInterviewScore } from "./evaluation-service";

/** INTRODUCTION always opens, CLOSING always closes - the 8 in between are shuffled per interview (see pickNextCategory), so the brief's "never ask same sequence" holds without ever skipping the bookends that make an interview feel structured. */
const MIDDLE_CATEGORIES: InterviewCategory[] = [
  "COMMUNICATION",
  "BEHAVIOR",
  "SALES",
  "PROBLEM_SOLVING",
  "ROLE_PLAY",
  "OBJECTION_HANDLING",
  "COMPANY_AWARENESS",
  "CAREER_GOALS",
];

/** Defensive cap - if Groq keeps returning moveToNextCategory:false, this forces progress rather than letting one category run forever. */
const MAX_FOLLOW_UPS_PER_CATEGORY = 2;

function pickNextCategory(covered: InterviewCategory[]): InterviewCategory | null {
  const remaining = MIDDLE_CATEGORIES.filter((c) => !covered.includes(c));
  if (remaining.length > 0) {
    return remaining[Math.floor(Math.random() * remaining.length)];
  }
  if (!covered.includes("CLOSING")) return "CLOSING";
  return null;
}

export interface AdvanceResult {
  done: boolean;
  message: string;
}

/**
 * The Interview Engine - the brief's core requirement, and the reason
 * there's no fixed question bank anywhere in this codebase. Called once
 * per conversational turn from the startInterview/advanceInterview Server
 * Action; every call either records the candidate's just-given answer,
 * asks Groq for the next thing to say, and persists a new Response row, or
 * (once every category including CLOSING is covered) finalizes the
 * Interview. Nothing about question wording or ordering is hardcoded here
 * - only the category sequence is engine-owned, the actual questions are
 * always Groq's.
 */
export async function advanceInterview(interviewId: string, candidateAnswer?: string): Promise<AdvanceResult> {
  const interview = await prisma.interview.findUniqueOrThrow({
    where: { id: interviewId },
    include: {
      responses: { orderBy: { sequence: "asc" } },
      link: { include: { candidate: { include: { job: { include: { template: true } } } } } },
    },
  });

  if (interview.status === "COMPLETED") {
    throw new Error("This interview has already been completed.");
  }

  const { template } = interview.link.candidate.job;
  const responses = interview.responses;
  const lastResponse = responses[responses.length - 1];

  // First turn ever - no question has been asked yet, nothing to record.
  if (!lastResponse) {
    const result = await requestInterviewerTurn(buildInterviewMessages(template, "INTRODUCTION", []));
    await prisma.response.create({
      data: { interviewId, category: "INTRODUCTION", question: result.message, sequence: 1, askedAt: new Date() },
    });
    return { done: false, message: result.message };
  }

  // Record the candidate's answer to the pending question.
  if (!lastResponse.answer) {
    if (!candidateAnswer?.trim()) {
      throw new Error("An answer is required to continue the interview.");
    }
    await prisma.response.update({
      where: { id: lastResponse.id },
      data: {
        answer: candidateAnswer,
        answeredAt: new Date(),
        responseTimeMs: Date.now() - lastResponse.askedAt.getTime(),
      },
    });
    lastResponse.answer = candidateAnswer; // keep the in-memory copy in sync for the transcript below
  }

  const currentCategory = lastResponse.category;
  const followUpsSoFar = responses.filter((r) => r.category === currentCategory).length;
  const forceAdvance = followUpsSoFar >= MAX_FOLLOW_UPS_PER_CATEGORY;

  const categoriesCovered = interview.categoriesCovered;
  const covedIfAdvancing = categoriesCovered.includes(currentCategory)
    ? categoriesCovered
    : [...categoriesCovered, currentCategory];
  const nextCategoryIfAdvancing = pickNextCategory(covedIfAdvancing);

  const transcript = responsesToTranscript(responses);
  const result = await requestInterviewerTurn(
    buildInterviewMessages(template, currentCategory, transcript, nextCategoryIfAdvancing)
  );

  const isAdvancing = forceAdvance || result.moveToNextCategory;

  if (!isAdvancing) {
    await prisma.response.create({
      data: {
        interviewId,
        category: currentCategory,
        question: result.message,
        sequence: responses.length + 1,
        askedAt: new Date(),
      },
    });
    return { done: false, message: result.message };
  }

  // Advancing: either to a new category, or - if there is none left - the interview is over.
  if (!nextCategoryIfAdvancing) {
    const startedAt = interview.startedAt ?? interview.createdAt;
    await prisma.$transaction([
      prisma.interview.update({
        where: { id: interviewId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationSeconds: Math.round((Date.now() - startedAt.getTime()) / 1000),
          categoriesCovered: covedIfAdvancing,
        },
      }),
      prisma.interviewLink.update({ where: { id: interview.linkId }, data: { status: "COMPLETED" } }),
    ]);

    // Best-effort: the candidate's closing message must never be blocked by
    // the scoring pass. A failed evaluation here just leaves this interview
    // unscored on the recruiter dashboard until it's retried, never the
    // candidate's problem.
    try {
      await generateInterviewScore(interviewId);
    } catch (error) {
      console.error("generateInterviewScore failed:", error);
    }

    return { done: true, message: result.message || "Thank you. Your interview has been completed successfully. Our recruitment team will review your interview. Have a great day." };
  }

  await prisma.interview.update({ where: { id: interviewId }, data: { categoriesCovered: covedIfAdvancing } });
  await prisma.response.create({
    data: {
      interviewId,
      category: nextCategoryIfAdvancing,
      question: result.message,
      sequence: responses.length + 1,
      askedAt: new Date(),
    },
  });
  return { done: false, message: result.message };
}
