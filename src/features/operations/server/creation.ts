import "server-only";

import { prisma } from "@/lib/prisma";
import type { OfferingRequest, Order, OperationItem } from "@prisma/client";

/**
 * Called from offering-requests/actions/request-actions.ts's submitRequest
 * right after the DRAFT->SUBMITTED transition - never at Draft creation, so
 * an abandoned wizard never shows up in Operations. Non-fatal by design at
 * the call site (wrapped in try/catch there): a failure to create the
 * Operations pointer row must never block the customer's request from
 * actually submitting.
 */
export async function createOperationItemForRequest(request: OfferingRequest): Promise<OperationItem> {
  return prisma.operationItem.create({
    data: {
      type: "REQUEST",
      requestId: request.id,
      activities: { create: { type: "CREATED", description: "Request submitted" } },
    },
  });
}

/**
 * Called from orders/actions/order-actions.ts on both paths that produce a
 * PAID order (the FREE short-circuit, and verifyPayment's success branch) -
 * never for a merely PENDING order, so an abandoned checkout never shows up
 * in Operations either. Same non-fatal-at-call-site contract as above.
 */
export async function createOperationItemForOrder(order: Order): Promise<OperationItem> {
  return prisma.operationItem.create({
    data: {
      type: "ORDER",
      orderId: order.id,
      activities: {
        create: [
          { type: "CREATED", description: "Order placed" },
          { type: "PAYMENT_RECEIVED", description: "Payment received" },
        ],
      },
    },
  });
}
