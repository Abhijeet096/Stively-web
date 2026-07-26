import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { resolveInterviewLink } from "@/features/interviews/server/link-queries";
import { InterviewSession } from "@/features/interviews/components/candidate/interview-session";

interface SessionPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Interview in Progress",
  robots: { index: false, follow: false },
};

/**
 * submitInterviewTurn (invoked from InterviewSession below) can retry the
 * Groq call up to 3 times (requestValidatedJson) - comfortably clears a
 * platform's default ~10s serverless function timeout on a slow attempt.
 * Raises the ceiling for this route's Server Actions; a no-op on plans that
 * cap lower than this regardless.
 */
export const maxDuration = 60;

/**
 * Requires an Interview row to already exist for this link - candidates
 * only ever reach this route via the landing page's "Start Interview"
 * button, which creates it first. Anyone hitting this URL directly without
 * having started is sent back to the landing page rather than shown a
 * broken session.
 */
export default async function InterviewSessionPage({ params }: SessionPageProps) {
  const { token } = await params;
  const resolution = await resolveInterviewLink(token);

  if (resolution.status !== "valid" && resolution.status !== "completed") {
    redirect(`/interview/${token}`);
  }

  const interview = await prisma.interview.findFirst({
    where: { link: { token } },
  });

  if (!interview) {
    redirect(`/interview/${token}`);
  }

  return <InterviewSession interviewId={interview.id} />;
}
