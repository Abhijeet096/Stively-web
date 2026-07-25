"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/actions/leads";
import { resolveInterviewLink } from "../server/link-queries";
import { checkRateLimit } from "../server/rate-limit";

export type StartInterviewResult = ActionResult & { interviewId?: string };

/**
 * Deliberately NOT behind requireRole - the candidate is never a Stively
 * User, this whole flow is designed to work without authentication (see
 * InterviewLink's own schema comment). The token itself, resolved fresh on
 * every call (not trusted from client state), is the only credential.
 * Idempotent: refreshing the interview page mid-session re-enters this
 * safely rather than creating a second Interview row (linkId is @unique).
 */
export async function startInterview(token: string): Promise<StartInterviewResult> {
  const resolution = await resolveInterviewLink(token);

  if (resolution.status === "not_found") return { success: false, error: "This interview link is invalid." };
  if (resolution.status === "expired") return { success: false, error: "This interview link has expired." };
  if (resolution.status === "completed") return { success: false, error: "This interview has already been completed." };

  if (!(await checkRateLimit(resolution.link.id))) {
    return { success: false, error: "Too many requests. Please wait a moment and try again." };
  }

  try {
    const existing = await prisma.interview.findUnique({ where: { linkId: resolution.link.id } });
    if (existing) {
      if (existing.status === "COMPLETED") {
        return { success: false, error: "This interview has already been completed." };
      }
      return { success: true, interviewId: existing.id };
    }

    const [interview] = await prisma.$transaction([
      prisma.interview.create({
        data: { linkId: resolution.link.id, status: "IN_PROGRESS", startedAt: new Date() },
      }),
      prisma.interviewLink.update({
        where: { id: resolution.link.id },
        data: { status: "IN_PROGRESS", usedAt: new Date() },
      }),
    ]);

    return { success: true, interviewId: interview.id };
  } catch (error) {
    console.error("startInterview failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
