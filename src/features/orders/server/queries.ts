import { prisma } from "@/lib/prisma";
import type { Order, Offering, Meeting } from "@prisma/client";

export const ORDER_PAGE_SIZE = 10;

export type OrderWithOffering = Order & { offering: Offering };
export type OrderWithMeetings = OrderWithOffering & { meetings: Meeting[] };

export interface PaginatedOrders {
  orders: OrderWithOffering[];
  totalCount: number;
  totalPages: number;
  page: number;
}

/**
 * "My Purchases" / "My Orders" - scoped to one user only. Unlike
 * getMyRequests (offering-requests/server/queries.ts), there's no separate
 * `type` filter to apply: checkout (src/app/checkout/[slug]/page.tsx)
 * already only lets a user buy an offering their own role/audience allows,
 * so every order a user has is already the "right" type for their role.
 */
export async function getMyOrders(userId: string, page = 1): Promise<PaginatedOrders> {
  const safePage = page > 0 ? page : 1;
  const where = { userId };

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { offering: true },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ORDER_PAGE_SIZE,
      take: ORDER_PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / ORDER_PAGE_SIZE)),
    page: safePage,
  };
}

/**
 * Ownership-scoped single lookup - same "not found and not yours look
 * identical" discipline as getRequestById. Also surfaces any Meetings
 * staff scheduled against this order's OperationItem (flattened onto the
 * return value as `meetings`, rather than the caller reaching through
 * `operationItem.meetings` - the nesting is an internal Operations
 * implementation detail the customer-facing order view shouldn't need to
 * know about).
 */
export async function getOrderById(id: string, userId: string): Promise<OrderWithMeetings | null> {
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: {
      offering: true,
      operationItem: { include: { meetings: { orderBy: { scheduledAt: "desc" } } } },
    },
  });
  if (!order) return null;

  const { operationItem, ...rest } = order;
  return { ...rest, meetings: operationItem?.meetings ?? [] };
}
