"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/actions/leads";
import { advanceInterview } from "../server/interview-engine";
import { checkRateLimit } from "../server/rate-limit";

export type InterviewTurnResult = ActionResult & { message?: string; done?: boolean };

/**
 * Deliberately NOT behind requireRole, same reasoning as startInterview -
 * candidates never authenticate. interviewId is an opaque cuid the
 * candidate only ever receives from the server (never guessable from the
 * public token), so it's a safe enough handle for the duration of one
 * session without a second auth layer.
 */
export async function submitInterviewTurn(interviewId: string, candidateAnswer?: string): Promise<InterviewTurnResult> {
  try {
    const interview = await prisma.interview.findUnique({ where: { id: interviewId }, select: { linkId: true } });
    if (!interview) return { success: false, error: "This interview could not be found." };

    if (!(await checkRateLimit(interview.linkId))) {
      return { success: false, error: "Too many requests. Please wait a moment and try again." };
    }

    const result = await advanceInterview(interviewId, candidateAnswer);
    return { success: true, message: result.message, done: result.done };
  } catch (error) {
    console.error("submitInterviewTurn failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export interface SessionInterview {
  id: string;
  status: string;
  candidateName: string;
  jobTitle: string;
  responses: { id: string; question: string; answer: string | null }[];
}

/** Loads the state the session UI needs to resume - e.g. after a page refresh mid-interview. */
export async function getSessionInterview(interviewId: string): Promise<SessionInterview | null> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      link: { include: { candidate: { include: { job: true } } } },
      responses: { orderBy: { sequence: "asc" } },
    },
  });
  if (!interview) return null;

  return {
    id: interview.id,
    status: interview.status,
    candidateName: interview.link.candidate.name,
    jobTitle: interview.link.candidate.job.title,
    responses: interview.responses.map((r) => ({ id: r.id, question: r.question, answer: r.answer })),
  };
}
