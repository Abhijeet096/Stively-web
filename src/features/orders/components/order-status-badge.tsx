import type { OrderStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL, ORDER_STATUS_BADGE_VARIANT } from "../lib/status-labels";

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_STATUS_BADGE_VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export { OrderStatusBadge };
