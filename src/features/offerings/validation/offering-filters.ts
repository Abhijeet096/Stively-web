import { z } from "zod";
import { OfferingAudience, OfferingCategory, Difficulty, Mode } from "@prisma/client";

import { PRICE_BUCKETS } from "../lib/price-buckets";

export const OFFERING_SORTS = ["newest", "featured", "popular", "price-asc", "price-desc"] as const;
export type OfferingSort = (typeof OFFERING_SORTS)[number];

export const SORT_LABEL: Record<OfferingSort, string> = {
  newest: "Newest",
  featured: "Featured",
  popular: "Popular",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

/**
 * The Offerings catalog's entire filter/sort/pagination state, as it comes
 * off the URL's searchParams - same role as ProgramFilters in
 * src/lib/queries/programs.ts, generalized across category/audience/
 * difficulty/mode/price rather than Program's fixed level/mode/duration set.
 */
export const offeringFiltersSchema = z.object({
  q: z.string().trim().min(1).optional(),
  category: z.nativeEnum(OfferingCategory).optional(),
  audience: z.nativeEnum(OfferingAudience).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  mode: z.nativeEnum(Mode).optional(),
  price: z.enum(PRICE_BUCKETS).optional(),
  sort: z.enum(OFFERING_SORTS).optional(),
  page: z.coerce.number().int().positive().optional(),
});

export type OfferingFiltersInput = z.infer<typeof offeringFiltersSchema>;

/** Parses raw (string | undefined) searchParams into validated filters - invalid/unknown values are dropped rather than rejected, same "silently ignore a bad query param" tolerance as isValidProgramLevel etc. in programs.ts. */
export function parseOfferingFilters(raw: Record<string, string | undefined>): OfferingFiltersInput {
  const result = offeringFiltersSchema.safeParse(raw);
  return result.success ? result.data : {};
}
