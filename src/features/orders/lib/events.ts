import type { Order } from "@prisma/client";

export type OrderEventType = "ORDER_CREATED" | "ORDER_PAID" | "ORDER_FAILED";

/**
 * Same "architecture only" stub as src/features/offering-requests/lib/events.ts's
 * emitOfferingRequestEvent - the one call site real receipt emails / payment
 * notifications will eventually wire into.
 */
export function emitOrderEvent(type: OrderEventType, order: Pick<Order, "id" | "userId" | "status">): void {
  console.log(`[order-event] ${type}`, { orderId: order.id, userId: order.userId, status: order.status });
}
