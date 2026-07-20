import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma, RequestStatus, OrderStatus } from "@prisma/client";
import type { OperationFiltersInput } from "../validation/operation-filters";
import type { OperationsViewer } from "./rbac";

export const OPERATION_PAGE_SIZE = 15;

const operationItemInclude = {
  request: { include: { user: true, offering: true } },
  order: { include: { user: true, offering: true } },
  assignedTo: true,
} satisfies Prisma.OperationItemInclude;

export type OperationItemWithRelations = Prisma.OperationItemGetPayload<{ include: typeof operationItemInclude }>;

/** Richer than the list include above - the detail page needs the full activity/comment/meeting history, which would be wasted payload on every card in a paginated list. */
const operationItemDetailInclude = {
  ...operationItemInclude,
  activities: { include: { performedBy: true }, orderBy: { createdAt: "asc" } },
  comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
  meetings: { orderBy: { scheduledAt: "desc" } },
} satisfies Prisma.OperationItemInclude;

export type OperationItemDetail = Prisma.OperationItemGetPayload<{ include: typeof operationItemDetailInclude }>;

export interface PaginatedOperationItems {
  items: OperationItemWithRelations[];
  totalCount: number;
  totalPages: number;
  page: number;
}

/**
 * Builds the viewer-scoping condition every Operations query applies -
 * `undefined` for full access (no filter added), otherwise restricts to
 * the viewer's own assignments. Centralized here so "only assigned" is
 * enforced in the query layer itself, not just hidden in the UI (the
 * brief's explicit security requirement).
 */
function viewerCondition(viewer: OperationsViewer): Prisma.OperationItemWhereInput | undefined {
  return viewer.hasFullAccess ? undefined : { assignedToId: viewer.teamMemberId };
}

/**
 * The Operations list query - every filter is an independent AND'd
 * condition, each potentially carrying its own OR (e.g. search spans
 * several joined fields) - built as an array and combined with `AND`
 * rather than spread into one object, since JS object literals can't hold
 * two keys both named "OR" without the second silently clobbering the
 * first.
 */
export async function getOperationItems(
  viewer: OperationsViewer,
  filters: OperationFiltersInput
): Promise<PaginatedOperationItems> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const conditions: Prisma.OperationItemWhereInput[] = [];

  const scope = viewerCondition(viewer);
  if (scope) conditions.push(scope);

  if (filters.type) conditions.push({ type: filters.type });
  if (filters.priority) conditions.push({ priority: filters.priority });

  if (filters.assignedTo === "unassigned") {
    conditions.push({ assignedToId: null });
  } else if (filters.assignedTo) {
    conditions.push({ assignedToId: filters.assignedTo });
  }

  if (filters.offeringId) {
    conditions.push({
      OR: [{ request: { offeringId: filters.offeringId } }, { order: { offeringId: filters.offeringId } }],
    });
  }

  if (filters.dateFrom || filters.dateTo) {
    conditions.push({
      createdAt: {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      },
    });
  }

  // Scoped strictly to a known type - RequestStatus and OrderStatus don't
  // share every value (e.g. "UNDER_REVIEW" isn't a valid OrderStatus), and
  // Prisma validates an enum argument against its field's real type even
  // inside an unreachable OR branch, so building both branches unconditionally
  // throws a PrismaClientValidationError the moment `type` narrows to one
  // side. A status filter with no `type` set is ambiguous - ignored rather
  // than guessed at (the toolbar only ever shows Status once Type is chosen,
  // so this only matters for a hand-edited URL).
  if (filters.status && filters.type === "REQUEST") {
    conditions.push({ request: { status: filters.status as RequestStatus } });
  } else if (filters.status && filters.type === "ORDER") {
    conditions.push({ order: { status: filters.status as OrderStatus } });
  }

  if (filters.q) {
    const q = filters.q;
    conditions.push({
      OR: [
        { request: { is: { user: { name: { contains: q, mode: "insensitive" } } } } },
        { request: { is: { user: { email: { contains: q, mode: "insensitive" } } } } },
        { request: { is: { offering: { title: { contains: q, mode: "insensitive" } } } } },
        { order: { is: { user: { name: { contains: q, mode: "insensitive" } } } } },
        { order: { is: { user: { email: { contains: q, mode: "insensitive" } } } } },
        { order: { is: { offering: { title: { contains: q, mode: "insensitive" } } } } },
      ],
    });
  }

  const where: Prisma.OperationItemWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  const [items, totalCount] = await Promise.all([
    prisma.operationItem.findMany({
      where,
      include: operationItemInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * OPERATION_PAGE_SIZE,
      take: OPERATION_PAGE_SIZE,
    }),
    prisma.operationItem.count({ where }),
  ]);

  return {
    items,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / OPERATION_PAGE_SIZE)),
    page,
  };
}

/** Ownership/assignment-scoped single lookup - returns null (not the row) if the viewer isn't allowed to see it, same "not found and not yours look identical" discipline used everywhere else in this codebase. */
export async function getOperationItemById(
  id: string,
  viewer: OperationsViewer
): Promise<OperationItemDetail | null> {
  const scope = viewerCondition(viewer);
  return prisma.operationItem.findFirst({
    where: { id, ...(scope ?? {}) },
    include: operationItemDetailInclude,
  });
}

export interface OperationsDashboardStats {
  todaysRequests: number;
  pendingReviews: number;
  pendingPayments: number;
  todaysMeetings: number;
  recentOrders: OperationItemWithRelations[];
  recentActivity: Prisma.ActivityLogGetPayload<{ include: { operationItem: true; performedBy: true } }>[];
  upcomingTasks: OperationItemWithRelations[];
}

/**
 * Every number here is a real query - no mocked statistics, same
 * discipline the existing /admin/dashboard's own comment already commits
 * to for Leads.
 */
export async function getOperationsDashboardStats(viewer: OperationsViewer): Promise<OperationsDashboardStats> {
  const scope = viewerCondition(viewer);
  const baseWhere: Prisma.OperationItemWhereInput = scope ?? {};

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    todaysRequests,
    pendingReviews,
    pendingPaymentRequests,
    pendingPaymentOrders,
    todaysMeetings,
    recentOrders,
    recentActivity,
    upcomingTasks,
  ] = await Promise.all([
    prisma.operationItem.count({
      where: { AND: [baseWhere, { type: "REQUEST", createdAt: { gte: startOfToday, lte: endOfToday } }] },
    }),
    prisma.operationItem.count({
      where: { AND: [baseWhere, { type: "REQUEST", request: { status: "UNDER_REVIEW" } }] },
    }),
    prisma.operationItem.count({
      where: { AND: [baseWhere, { type: "REQUEST", request: { status: "WAITING_FOR_PAYMENT" } }] },
    }),
    prisma.operationItem.count({
      where: { AND: [baseWhere, { type: "ORDER", order: { status: "PENDING" } }] },
    }),
    prisma.meeting.count({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        operationItem: baseWhere,
      },
    }),
    prisma.operationItem.findMany({
      where: { AND: [baseWhere, { type: "ORDER" }] },
      include: operationItemInclude,
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.activityLog.findMany({
      where: { operationItem: baseWhere },
      include: { operationItem: true, performedBy: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.operationItem.findMany({
      where: { AND: [baseWhere, { dueDate: { not: null, gte: new Date() } }] },
      include: operationItemInclude,
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  return {
    todaysRequests,
    pendingReviews,
    pendingPayments: pendingPaymentRequests + pendingPaymentOrders,
    todaysMeetings,
    recentOrders,
    recentActivity,
    upcomingTasks,
  };
}

export async function searchOperationItems(
  viewer: OperationsViewer,
  query: string,
  limit = 8
): Promise<OperationItemWithRelations[]> {
  const scope = viewerCondition(viewer);
  return prisma.operationItem.findMany({
    where: {
      AND: [
        scope ?? {},
        {
          OR: [
            { request: { is: { user: { name: { contains: query, mode: "insensitive" } } } } },
            { request: { is: { offering: { title: { contains: query, mode: "insensitive" } } } } },
            { order: { is: { user: { name: { contains: query, mode: "insensitive" } } } } },
            { order: { is: { offering: { title: { contains: query, mode: "insensitive" } } } } },
          ],
        },
      ],
    },
    include: operationItemInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
