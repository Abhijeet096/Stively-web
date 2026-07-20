import Link from "next/link";

import { formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { formatOrderNumber } from "../lib/order-number";
import { OrderStatusBadge } from "./order-status-badge";
import type { OrderWithOffering } from "../server/queries";

/**
 * Receipt-style confirmation - number, offering, amount, status, paid
 * date. No Enrollment/Project record exists yet to link out to (see
 * prisma/schema.prisma's Order comment) - a PAID order here is the whole
 * story for now.
 */
function OrderDetailView({ order }: { order: OrderWithOffering }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground font-mono text-sm">{formatOrderNumber(order.sequence)}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">{order.offering.title}</h2>
      </header>

      <Card className="max-w-md">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Amount</span>
            <span className="text-foreground font-display text-lg font-semibold tabular-nums">
              {order.amount === 0 ? "Free" : formatPrice(order.amount, order.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Order date</span>
            <span className="text-foreground text-sm">
              {order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          {order.paidAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Paid on</span>
              <span className="text-foreground text-sm">
                {order.paidAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          )}
          {order.status === "PAID" && (
            <p className="text-success text-sm font-medium">
              You&apos;re confirmed for {order.offering.title}. Our team will be in touch with next steps.
            </p>
          )}
          {order.status === "PENDING" && (
            <p className="text-muted-foreground text-sm">This payment hasn&apos;t completed yet.</p>
          )}
          {order.status === "FAILED" && (
            <p className="text-destructive text-sm">This payment didn&apos;t go through - you can try again.</p>
          )}
        </CardContent>
      </Card>

      <Link href={`/offerings/${order.offering.slug}`} className="text-primary text-sm font-medium underline-offset-4 hover:underline">
        View offering
      </Link>
    </div>
  );
}

export { OrderDetailView };
