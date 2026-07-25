import { prisma } from "@/lib/prisma";
import type { InterviewLink, Candidate, Job, InterviewTemplate } from "@prisma/client";

export type ResolvedLink = InterviewLink & {
  candidate: Candidate & { job: Job & { template: InterviewTemplate } };
};

export type LinkResolution =
  | { status: "valid"; link: ResolvedLink }
  | { status: "not_found" }
  | { status: "expired" }
  | { status: "completed" };

/**
 * The one function every candidate-facing route (/interview/[token]/*)
 * resolves through - deliberately returns a closed set of outcomes rather
 * than throwing, so the landing page can render a specific, honest message
 * ("this link has expired" vs "this interview is already complete") instead
 * of a generic 404 for every failure mode. Lazily flips a link to EXPIRED
 * on the first read past its expiry - a write-on-read, but a cheap and
 * accurate one, so the recruiter dashboard's status filter (M5) never has
 * to separately recompute "is this actually expired" at query time.
 */
export async function resolveInterviewLink(token: string): Promise<LinkResolution> {
  const link = await prisma.interviewLink.findUnique({
    where: { token },
    include: { candidate: { include: { job: { include: { template: true } } } } },
  });
  if (!link) return { status: "not_found" };

  if (link.status === "COMPLETED") return { status: "completed" };

  if (link.expiresAt < new Date()) {
    if (link.status !== "EXPIRED") {
      await prisma.interviewLink.update({ where: { id: link.id }, data: { status: "EXPIRED" } });
    }
    return { status: "expired" };
  }

  return { status: "valid", link };
}

/** Fire-and-observe: the landing page renders regardless of whether this succeeds - opening the page should never fail just because this side write did. */
export async function markLinkOpened(token: string): Promise<void> {
  try {
    await prisma.interviewLink.updateMany({
      where: { token, status: { in: ["PENDING", "SENT"] } },
      data: { status: "OPENED" },
    });
  } catch (error) {
    console.error("markLinkOpened failed:", error);
  }
}
