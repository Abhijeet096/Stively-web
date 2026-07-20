import { prisma } from "@/lib/prisma";
import type { OfferingRequest, Offering, OfferingRequestHistory, Prisma, RequestType } from "@prisma/client";

import type { RequestFiltersInput, RequestSort } from "../validation/request-filters";

export const REQUEST_PAGE_SIZE = 10;

export type OfferingRequestWithOffering = OfferingRequest & { offering: Offering };
export type OfferingRequestWithDetail = OfferingRequest & {
  offering: Offering;
  history: OfferingRequestHistory[];
};

export interface PaginatedRequests {
  requests: OfferingRequestWithOffering[];
  totalCount: number;
  totalPages: number;
  page: number;
}

function sortToOrderBy(sort: RequestSort | undefined): Prisma.OfferingRequestOrderByWithRelationInput[] {
  return sort === "oldest" ? [{ createdAt: "asc" }] : [{ createdAt: "desc" }];
}

/**
 * "My Requests" / "My Service Requests" - always scoped to one user and one
 * requestType (a Student never sees Business rows and vice versa, enforced
 * here rather than trusted from a client-supplied filter). Every request
 * card needs its Offering (title, slug) - included, not a second query per
 * card.
 */
export async function getMyRequests(
  userId: string,
  requestType: RequestType,
  filters: RequestFiltersInput
): Promise<PaginatedRequests> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;

  const where: Prisma.OfferingRequestWhereInput = {
    userId,
    requestType,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.since ? { createdAt: { gte: new Date(filters.since) } } : {}),
    ...(filters.q
      ? {
          OR: [
            { offering: { title: { contains: filters.q, mode: "insensitive" as const } } },
            { notes: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [requests, totalCount] = await Promise.all([
    prisma.offeringRequest.findMany({
      where,
      include: { offering: true },
      orderBy: sortToOrderBy(filters.sort),
      skip: (page - 1) * REQUEST_PAGE_SIZE,
      take: REQUEST_PAGE_SIZE,
    }),
    prisma.offeringRequest.count({ where }),
  ]);

  return {
    requests,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / REQUEST_PAGE_SIZE)),
    page,
  };
}

/**
 * Ownership-scoped single lookup for the request detail page - returns
 * null for "doesn't exist" AND "exists but isn't yours", identically, so
 * the caller's notFound() never leaks which case it was (same discipline
 * requireRole's redirect-to-own-dashboard follows for role mismatches).
 */
export async function getRequestById(
  id: string,
  userId: string
): Promise<OfferingRequestWithDetail | null> {
  return prisma.offeringRequest.findFirst({
    where: { id, userId },
    include: { offering: true, history: { orderBy: { createdAt: "asc" } } },
  });
}

/**
 * The wizard's entire autosave/resume mechanism: find the user's existing
 * Draft for this exact offering + request type, or start a fresh one. No
 * separate draft-storage system - the Draft status on a real row IS the
 * draft.
 */
export async function getOrCreateDraftRequest(
  userId: string,
  offeringId: string,
  requestType: RequestType,
  source?: string
): Promise<OfferingRequest> {
  const existing = await prisma.offeringRequest.findFirst({
    where: { userId, offeringId, requestType, status: "DRAFT" },
  });
  if (existing) return existing;

  return prisma.offeringRequest.create({
    data: {
      userId,
      offeringId,
      requestType,
      source,
      history: { create: { eventType: "CREATED", toStatus: "DRAFT" } },
    },
  });
}
