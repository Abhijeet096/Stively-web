import "server-only";

import { prisma } from "@/lib/prisma";
import { requestInterviewEvaluation } from "./groq-client";
import { buildEvaluationMessages, isSalesRelevantTemplate, responsesToTranscript } from "./prompt-service";

/**
 * Runs the single end-of-interview evaluation pass and persists the Score
 * row - called once, from InterviewEngine's finalize step, right after an
 * Interview flips to COMPLETED. Never shown to the candidate; feeds the
 * recruiter review dashboard (M5) and nothing else.
 */
export async function generateInterviewScore(interviewId: string): Promise<void> {
  const interview = await prisma.interview.findUniqueOrThrow({
    where: { id: interviewId },
    include: {
      responses: { orderBy: { sequence: "asc" } },
      link: { include: { candidate: { include: { job: { include: { template: true } } } } } },
      score: true,
    },
  });

  if (interview.score) return; // already scored - avoid a duplicate Groq call and DB row on a retried finalize

  const { template } = interview.link.candidate.job;
  const transcript = responsesToTranscript(interview.responses);

  const evaluation = await requestInterviewEvaluation(buildEvaluationMessages(template, transcript));

  // Deterministic override, not just a prompt instruction - see
  // isSalesRelevantTemplate's own comment for why this is decided from the
  // template rather than trusted to the model's judgment on any given pass.
  const salesSkills = isSalesRelevantTemplate(template) ? evaluation.salesSkills : null;

  await prisma.score.create({
    data: {
      interviewId,
      overall: evaluation.overall,
      communication: evaluation.communication,
      confidence: evaluation.confidence,
      professionalism: evaluation.professionalism,
      salesSkills,
      problemSolving: evaluation.problemSolving,
      leadershipPotential: evaluation.leadershipPotential,
      learningAbility: evaluation.learningAbility,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      suggestedTraining: evaluation.suggestedTraining,
      recommendation: evaluation.recommendation,
      rawEvaluation: evaluation,
    },
  });
}
