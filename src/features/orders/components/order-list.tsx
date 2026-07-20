import { Receipt } from "lucide-react";

import { EmptyState } from "@/components/sections/empty-state";
import { OrderCard } from "./order-card";
import type { OrderWithOffering } from "../server/queries";

export interface OrderListProps {
  orders: OrderWithOffering[];
  hrefFor: (order: OrderWithOffering) => string;
  emptyStateHref: string;
}

function OrderList({ orders, hrefFor, emptyStateHref }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No purchases yet"
        description="Once you buy an offering, it'll show up here."
        actionLabel="Browse offerings"
        actionHref={emptyStateHref}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} href={hrefFor(order)} />
      ))}
    </div>
  );
}

export { OrderList };
