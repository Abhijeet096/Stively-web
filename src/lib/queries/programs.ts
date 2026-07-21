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
 * rather than rendered on every request. Also used by sitemap.ts.
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

/**
 * Sitemap-only variant of the above - carries `updatedAt` so sitemap.ts can
 * report each program's real last-modified date instead of "now" on every
 * request. Kept separate from `getAllProgramSlugs` rather than changing its
 * return shape, since that function's only other caller
 * (training/[slug]'s generateStaticParams) just needs the slug list.
 */
export async function getAllProgramSlugsWithDates(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  try {
    return await prisma.program.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
  } catch (error) {
    console.error("getAllProgramSlugsWithDates failed:", error);
    return [];
  }
}

export const PROGRAM_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const PROGRAM_MODES = ["ONLINE", "OFFLINE", "HYBRID"] as const;
export const DURATION_BUCKETS = ["under-4", "4-8", "8-plus"] as const;

export type DurationBucket = (typeof DURATION_BUCKETS)[number];

export function isValidProgramLevel(value: string | undefined): value is Program["level"] {
  return !!value && (PROGRAM_LEVELS as readonly string[]).includes(value);
}

export function isValidProgramMode(value: string | undefined): value is Program["mode"] {
  return !!value && (PROGRAM_MODES as readonly string[]).includes(value);
}

export function isValidDurationBucket(value: string | undefined): value is DurationBucket {
  return !!value && (DURATION_BUCKETS as readonly string[]).includes(value);
}

export const PROGRAM_PAGE_SIZE = 9;

export interface ProgramFilters {
  search?: string;
  level?: Program["level"];
  mode?: Program["mode"];
  duration?: DurationBucket;
  page?: number;
}

export interface PaginatedPrograms {
  programs: Program[];
  totalCount: number;
  totalPages: number;
  page: number;
}

function durationBucketToRange(bucket: DurationBucket): { gte?: number; lte?: number } {
  switch (bucket) {
    case "under-4":
      return { lte: 3 };
    case "4-8":
      return { gte: 4, lte: 8 };
    case "8-plus":
      return { gte: 9 };
  }
}

/**
 * The Training listing page's core query - search, level/mode/duration
 * filters, and server-side pagination, all translated into a single Prisma
 * `where` clause. Deliberately does NOT catch-and-degrade errors the way
 * getFeaturedPrograms does above: on this page the program list IS the
 * page's entire content, not a supplementary section, so a real DB failure
 * needs to reach the error boundary rather than be indistinguishable from
 * "your filters matched nothing" - same reasoning as getProgramBySlug not
 * swallowing errors either.
 */
export async function getPaginatedPrograms(filters: ProgramFilters): Promise<PaginatedPrograms> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;

  const where = {
    published: true,
    ...(filters.search
      ? { title: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.mode ? { mode: filters.mode } : {}),
    ...(filters.duration ? { durationWeeks: durationBucketToRange(filters.duration) } : {}),
  };

  const [programs, totalCount] = await Promise.all([
    prisma.program.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PROGRAM_PAGE_SIZE,
      take: PROGRAM_PAGE_SIZE,
    }),
    prisma.program.count({ where }),
  ]);

  return {
    programs,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PROGRAM_PAGE_SIZE)),
    page,
  };
}
