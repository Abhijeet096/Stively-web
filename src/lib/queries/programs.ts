import { prisma } from "../prisma";
import type { Program } from "@prisma/client";

/**
 * Programs shown on the Home page overview. Published + most recent first,
 * capped at 3 per the Phase E wireframe ("3 ProgramCards + view-all").
 *
 * Errors are caught and logged rather than thrown - a homepage should never
 * hard-fail because one non-critical section's query failed. The caller
 * (Home page) treats an empty array as "omit this section" per the Phase E
 * rule that marketing pages omit empty sections rather than showing an
 * EmptyState.
 */
export async function getFeaturedPrograms(limit = 3): Promise<Program[]> {
  try {
    return await prisma.program.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("getFeaturedPrograms failed:", error);
    return [];
  }
}
