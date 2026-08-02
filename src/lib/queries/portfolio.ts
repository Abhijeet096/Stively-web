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

/** The /work/[slug] case-study detail page's data source - published only (an unpublished item 404s for a public visitor, same as any other draft content). */
export async function getPortfolioItemBySlug(slug: string): Promise<PortfolioItem | null> {
  try {
    return await prisma.portfolioItem.findFirst({ where: { slug, published: true } });
  } catch (error) {
    console.error("getPortfolioItemBySlug failed:", error);
    return null;
  }
}

/** generateStaticParams' data source for /work/[slug] - published slugs only. */
export async function getAllPublishedPortfolioSlugs(): Promise<string[]> {
  try {
    const items = await prisma.portfolioItem.findMany({
      where: { published: true, slug: { not: null } },
      select: { slug: true },
    });
    return items.map((item) => item.slug).filter((slug): slug is string => !!slug);
  } catch (error) {
    console.error("getAllPublishedPortfolioSlugs failed:", error);
    return [];
  }
}

/** /admin/portfolio's list source - published and unpublished, sortOrder-ordered (no featured-first bump, since this is a management view, not a teaser). */
export async function getAllPortfolioItemsForAdmin(): Promise<PortfolioItem[]> {
  try {
    return await prisma.portfolioItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  } catch (error) {
    console.error("getAllPortfolioItemsForAdmin failed:", error);
    return [];
  }
}

/** /admin/portfolio/[id]'s edit-form data source - includes unpublished items (an admin editing a draft must see it), unlike getPortfolioItemBySlug above. */
export async function getPortfolioItemById(id: string): Promise<PortfolioItem | null> {
  try {
    return await prisma.portfolioItem.findUnique({ where: { id } });
  } catch (error) {
    console.error("getPortfolioItemById failed:", error);
    return null;
  }
}
