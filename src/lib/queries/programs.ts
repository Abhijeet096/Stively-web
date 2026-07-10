import { prisma } from "@/lib/prisma";
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

/**
 * Single program lookup for the Program Detail page. Deliberately does NOT
 * catch-and-return-null the way the list queries above do - a real DB
 * failure here needs to surface as an error (Next.js error boundary), not
 * be silently treated the same as "no such program" (404). Conflating the
 * two would mean a temporary DB outage makes a real program look
 * permanently deleted to both users and search engines - a materially
 * worse and misleading outcome than a visible error state.
 *
 * Returns null only for the legitimate case: no published program with
 * this slug exists. The page calls notFound() on a null result.
 */
export async function getProgramBySlug(slug: string): Promise<Program | null> {
  return prisma.program.findFirst({
    where: { slug, published: true },
  });
}

/**
 * All published slugs, for generateStaticParams - lets Program Detail
 * pages be statically generated at build time per the Phase B/D pattern,
 * rather than rendered on every request.
 */
export async function getAllProgramSlugs(): Promise<string[]> {
  try {
    const programs = await prisma.program.findMany({
      where: { published: true },
      select: { slug: true },
    });
    return programs.map((p: { slug: string }) => p.slug);
  } catch (error) {
    console.error("getAllProgramSlugs failed:", error);
    return [];
  }
}
