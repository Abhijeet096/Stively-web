import { z } from "zod";
import { RequestStatus } from "@prisma/client";

export const REQUEST_SORTS = ["newest", "oldest"] as const;
export type RequestSort = (typeof REQUEST_SORTS)[number];

/** "My Requests"/"My Service Requests" list filters - status/date/search, per the brief's FILTERS section (type isn't exposed here since each list page is inherently one type; the schema stays reusable for a future combined admin view). */
export const requestFiltersSchema = z.object({
  q: z.string().trim().min(1).optional(),
  status: z.nativeEnum(RequestStatus).optional(),
  since: z.string().date().optional(),
  sort: z.enum(REQUEST_SORTS).optional(),
  page: z.coerce.number().int().positive().optional(),
});

export type RequestFiltersInput = z.infer<typeof requestFiltersSchema>;

export function parseRequestFilters(raw: Record<string, string | undefined>): RequestFiltersInput {
  const result = requestFiltersSchema.safeParse(raw);
  return result.success ? result.data : {};
}
