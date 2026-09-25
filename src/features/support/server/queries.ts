import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Unfiltered: open queries first (status enum declares OPEN before
 * RESOLVED), oldest-waiting first within that group, so the longest-waiting
 * student surfaces at the top. Filtered to RESOLVED specifically: newest
 * first, since that's a resolved-history view, not a queue.
 */
export async function getStudentQueriesForAdmin(status?: "OPEN" | "RESOLVED") {
  return prisma.studentQuery.findMany({
    where: status ? { status } : undefined,
    include: {
      student: { select: { name: true, email: true } },
      resolvedBy: { select: { name: true } },
    },
    orderBy: status === "RESOLVED" ? [{ createdAt: "desc" }] : [{ status: "asc" }, { createdAt: "asc" }],
  });
}

export type StudentQueryForAdmin = Awaited<ReturnType<typeof getStudentQueriesForAdmin>>[number];
