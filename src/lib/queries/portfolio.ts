import { prisma } from "@/lib/prisma";
import type { PortfolioItem } from "@prisma/client";

/**
 * Homepage teaser - published only, featured items first (lets whoever
 * manages content promote a strongest-piece-first without reordering
 * everything else), then sortOrder. Same catch-and-degrade pattern as
 * getFeaturedTestimonials: a missing showcase is a minor, acceptable
 * degradation, not a page-breaking one.
 */
export async function getFeaturedPortfolioItems(limit = 3): Promise<PortfolioItem[]> {
  try {
    return await prisma.portfolioItem.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
      take: limit,
    });
  } catch (error) {
    console.error("getFeaturedPortfolioItems failed:", error);
    return [];
  }
}

/** Full list for the dedicated /work page - same ordering, no limit. */
export async function getAllPublishedPortfolioItems(): Promise<PortfolioItem[]> {
  try {
    return await prisma.portfolioItem.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    });
  } catch (error) {
    console.error("getAllPublishedPortfolioItems failed:", error);
    return [];
  }
}
