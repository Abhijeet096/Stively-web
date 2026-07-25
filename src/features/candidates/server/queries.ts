import { prisma } from "@/lib/prisma";
import type { Candidate, InterviewLink, Interview, Score, Recommendation, InterviewStatus, Prisma } from "@prisma/client";

export type CandidateWithLinks = Candidate & {
  links: (InterviewLink & { interview: Interview | null })[];
  job: { title: string };
};

/** Every candidate for one job, most recently invited first - the list JobDetail's "View all" links to. */
export async function getCandidatesByJob(jobId: string): Promise<CandidateWithLinks[]> {
  return prisma.candidate.findMany({
    where: { jobId },
    include: {
      links: { include: { interview: true }, orderBy: { createdAt: "desc" } },
      job: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Every candidate across every job - the recruiter dashboard's base list (M5 adds filters/search over this). */
export async function getAllCandidates(): Promise<CandidateWithLinks[]> {
  return prisma.candidate.findMany({
    include: {
      links: { include: { interview: true }, orderBy: { createdAt: "desc" } },
      job: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type CandidateForReview = Candidate & {
  job: { id: string; title: string };
  links: (InterviewLink & { interview: (Interview & { score: Score | null }) | null })[];
};

export interface CandidateReviewFilters {
  jobId?: string;
  status?: InterviewStatus;
  recommendation?: Recommendation;
  search?: string;
}

/**
 * The recruiter review list's data source - one row per candidate, most
 * recent link (and its interview/score, if any) included. Filters compose
 * as a single Prisma query rather than filtering client-side, since this
 * list is meant to scale past the small "test everything by eye" dataset
 * job/candidate lists elsewhere in this feature stay simple with.
 */
export async function getCandidatesForReview(filters: CandidateReviewFilters): Promise<CandidateForReview[]> {
  const where: Prisma.CandidateWhereInput = {};

  if (filters.jobId) where.jobId = filters.jobId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.status) {
    where.links = { some: { interview: { status: filters.status } } };
  }
  if (filters.recommendation) {
    where.links = { some: { interview: { score: { recommendation: filters.recommendation } } } };
  }

  return prisma.candidate.findMany({
    where,
    include: {
      job: { select: { id: true, title: true } },
      links: {
        include: { interview: { include: { score: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type CandidateReport = Candidate & {
  job: { id: string; title: string; department: string };
  links: (InterviewLink & {
    interview:
      | (Interview & {
          score: Score | null;
          responses: {
            id: string;
            category: string;
            question: string;
            answer: string | null;
            askedAt: Date;
            answeredAt: Date | null;
            responseTimeMs: number | null;
            sequence: number;
          }[];
        })
      | null;
  })[];
};

/** Everything the candidate detail/report page needs - one query, full transcript included. */
export async function getCandidateReport(candidateId: string): Promise<CandidateReport | null> {
  return prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: { select: { id: true, title: true, department: true } },
      links: {
        include: {
          interview: {
            include: {
              score: true,
              responses: { orderBy: { sequence: "asc" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}
