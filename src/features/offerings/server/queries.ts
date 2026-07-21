import { prisma } from "@/lib/prisma";
import type { Offering, OfferingCategory, Prisma } from "@prisma/client";

import type { OfferingFiltersInput, OfferingSort } from "../validation/offering-filters";
import { priceBucketToFilter } from "../lib/price-buckets";

export const OFFERING_PAGE_SIZE = 12;

export interface PaginatedOfferings {
  offerings: Offering[];
  totalCount: number;
  totalPages: number;
  page: number;
}

function sortToOrderBy(sort: OfferingSort | undefined): Prisma.OfferingOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "popular":
      return [{ viewCount: "desc" }, { createdAt: "desc" }];
    case "price-asc":
      return [{ price: { sort: "asc", nulls: "last" } }];
    case "price-desc":
      return [{ price: { sort: "desc", nulls: "last" } }];
    case "featured":
    default:
      return [{ featured: "desc" }, { createdAt: "desc" }];
  }
}

/**
 * The Offerings catalog's core query - every browse surface (the public
 * /offerings page, a category page, a dashboard's audience section) reads
 * through this one function so filter/sort/pagination logic exists exactly
 * once. Always scoped to PUBLISHED + visible - Draft/Archived/Coming Soon
 * offerings never appear in a public listing regardless of what filters are
 * passed, same "the query layer enforces the business rule" precedent as
 * getPaginatedPrograms scoping to `published: true`.
 */
export async function getOfferings(
  filters: OfferingFiltersInput & { page?: number }
): Promise<PaginatedOfferings> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;

  const where: Prisma.OfferingWhereInput = {
    status: "PUBLISHED",
    visible: true,
    ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" as const } } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.audience ? { audience: filters.audience } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.mode ? { mode: filters.mode } : {}),
    ...(filters.price ? priceBucketToFilter(filters.price) : {}),
  };

  const [offerings, totalCount] = await Promise.all([
    prisma.offering.findMany({
      where,
      orderBy: sortToOrderBy(filters.sort),
      skip: (page - 1) * OFFERING_PAGE_SIZE,
      take: OFFERING_PAGE_SIZE,
    }),
    prisma.offering.count({ where }),
  ]);

  return {
    offerings,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / OFFERING_PAGE_SIZE)),
    page,
  };
}

/**
 * Single offering lookup for the detail page. Fires a fire-and-forget
 * viewCount increment (not awaited, errors swallowed) rather than blocking
 * the page render on a write - a failed view-count bump should never turn
 * into a broken detail page. Deliberately does NOT catch-and-return-null on
 * the read itself, same reasoning as getProgramBySlug: a real DB failure
 * here should surface as an error, not look identical to "no such offering".
 */
export async function getOfferingBySlug(slug: string): Promise<Offering | null> {
  const offering = await prisma.offering.findFirst({
    where: { slug, status: "PUBLISHED", visible: true },
  });

  if (offering) {
    prisma.offering
      .update({ where: { id: offering.id }, data: { viewCount: { increment: 1 } } })
      .catch((error: unknown) => console.error("viewCount increment failed:", error));
  }

  return offering;
}

/**
 * Same lookup, no viewCount side effect - for surfacing a real offering's
 * price/details on a page that isn't that offering's own detail page (e.g.
 * a service landing page's Pricing section referencing the matching
 * catalog item). Counting that as a "view" of the offering itself would
 * inflate the metric with traffic that never actually looked at it.
 */
export async function getOfferingForDisplay(slug: string): Promise<Offering | null> {
  return prisma.offering.findFirst({
    where: { slug, status: "PUBLISHED", visible: true },
  });
}

export async function getFeaturedOfferings(limit = 6): Promise<Offering[]> {
  try {
    return await prisma.offering.findMany({
      where: { status: "PUBLISHED", visible: true, featured: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("getFeaturedOfferings failed:", error);
    return [];
  }
}

/**
 * The one function both the Student and Business dashboards call - per the
 * brief's business rule ("Student Dashboard should automatically display
 * Offerings where Audience = Student OR Both... No duplicated logic"),
 * every "browse offerings for my role" surface goes through this, not a
 * copy-pasted `audience IN [...]` where clause per dashboard.
 */
export async function getOfferingsForAudience(
  audience: "STUDENT" | "BUSINESS",
  limit = 6
): Promise<Offering[]> {
  try {
    return await prisma.offering.findMany({
      where: { status: "PUBLISHED", visible: true, audience: { in: [audience, "BOTH"] } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  } catch (error) {
    console.error("getOfferingsForAudience failed:", error);
    return [];
  }
}

export async function getRelatedOfferings(offering: Offering, limit = 3): Promise<Offering[]> {
  try {
    return await prisma.offering.findMany({
      where: {
        status: "PUBLISHED",
        visible: true,
        category: offering.category,
        id: { not: offering.id },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  } catch (error) {
    console.error("getRelatedOfferings failed:", error);
    return [];
  }
}

/** For generateStaticParams and sitemap.ts - published offering slugs only. */
export async function getAllOfferingSlugs(): Promise<string[]> {
  try {
    const offerings = await prisma.offering.findMany({
      where: { status: "PUBLISHED", visible: true },
      select: { slug: true },
    });
    return offerings.map((o: { slug: string }) => o.slug);
  } catch (error) {
    console.error("getAllOfferingSlugs failed:", error);
    return [];
  }
}

/** Categories with at least one published, visible offering - for sitemap.ts, so an empty category never gets an indexed archive URL. */
export async function getAllUsedCategorySlugs(): Promise<OfferingCategory[]> {
  try {
    const grouped = await prisma.offering.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED", visible: true },
    });
    return grouped.map((g: { category: OfferingCategory }) => g.category);
  } catch (error) {
    console.error("getAllUsedCategorySlugs failed:", error);
    return [];
  }
}

/**
 * Sitemap-only variant of getAllOfferingSlugs - carries `updatedAt` so
 * sitemap.ts can report each offering's real last-modified date instead of
 * "now" on every request. Kept separate rather than changing
 * getAllOfferingSlugs's return shape, since that function's other caller
 * (offerings/[slug]'s generateStaticParams) just needs the slug list.
 */
export async function getAllOfferingSlugsWithDates(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  try {
    return await prisma.offering.findMany({
      where: { status: "PUBLISHED", visible: true },
      select: { slug: true, updatedAt: true },
    });
  } catch (error) {
    console.error("getAllOfferingSlugsWithDates failed:", error);
    return [];
  }
}

/**
 * Per-category most-recent-update timestamp, paired with
 * getAllUsedCategorySlugs for sitemap.ts's category archive entries.
 */
export async function getCategoryLastModifiedMap(): Promise<Record<string, Date>> {
  try {
    const grouped = await prisma.offering.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED", visible: true },
      _max: { updatedAt: true },
    });
    return Object.fromEntries(
      grouped
        .filter((g: { _max: { updatedAt: Date | null } }) => g._max.updatedAt)
        .map((g: { category: OfferingCategory; _max: { updatedAt: Date | null } }) => [
          g.category,
          g._max.updatedAt as Date,
        ])
    );
  } catch (error) {
    console.error("getCategoryLastModifiedMap failed:", error);
    return {};
  }
}
