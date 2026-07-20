import Link from "next/link";

import { formatPrice } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { formatOrderNumber } from "../lib/order-number";
import { OrderStatusBadge } from "./order-status-badge";
import type { OrderWithOffering } from "../server/queries";

function OrderCard({ order, href }: { order: OrderWithOffering; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card variant="interactive" className="h-full">
        <CardHeader>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground font-mono text-xs">{formatOrderNumber(order.sequence)}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <CardTitle className="font-display">{order.offering.title}</CardTitle>
          <CardDescription>
            {order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-border/70 mt-auto justify-between border-t pt-4">
          <span className="text-foreground font-display text-base font-semibold tabular-nums">
            {order.amount === 0 ? "Free" : formatPrice(order.amount, order.currency)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export { OrderCard };
