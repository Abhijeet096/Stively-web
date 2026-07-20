import { z } from "zod";
import { OfferingEnrollmentStatus } from "@prisma/client";

/** Architecture for the brief's "Search enrollments"/filters requirement - not a built search UI this phase, same status as offering-requests' own filter schema was before its list page existed. */
export const enrollmentFiltersSchema = z.object({
  q: z.string().trim().min(1).optional(),
  status: z.nativeEnum(OfferingEnrollmentStatus).optional(),
  offeringId: z.string().trim().min(1).optional(),
  dateFrom: z.string().trim().min(1).optional(),
  dateTo: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().optional(),
});

export type EnrollmentFiltersInput = z.infer<typeof enrollmentFiltersSchema>;
