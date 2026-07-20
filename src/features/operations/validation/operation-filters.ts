import { z } from "zod";
import { OperationItemType, OperationPriority } from "@prisma/client";

/**
 * `status` is deliberately a plain string, not z.nativeEnum - OperationItem
 * doesn't store its own status (see the model's comment in
 * prisma/schema.prisma), so a filter value has to be checked against
 * whichever of RequestStatus/OrderStatus is relevant per item in the query
 * layer (src/features/operations/server/queries.ts), not validated against
 * one fixed enum here.
 */
export const operationFiltersSchema = z.object({
  q: z.string().trim().min(1).optional(),
  type: z.nativeEnum(OperationItemType).optional(),
  status: z.string().trim().min(1).optional(),
  priority: z.nativeEnum(OperationPriority).optional(),
  /** A TeamMember id, or the literal "unassigned". */
  assignedTo: z.string().trim().min(1).optional(),
  offeringId: z.string().trim().min(1).optional(),
  dateFrom: z.string().trim().min(1).optional(),
  dateTo: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().optional(),
});

export type OperationFiltersInput = z.infer<typeof operationFiltersSchema>;

export function parseOperationFilters(raw: Record<string, string | undefined>): OperationFiltersInput {
  const result = operationFiltersSchema.safeParse(raw);
  return result.success ? result.data : {};
}
