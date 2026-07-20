import { Badge, type BadgeProps } from "@/components/ui/badge";
import { getRequestStageLabel, ORDER_STAGE_LABEL } from "../lib/stage-labels";
import type { OperationItemWithRelations } from "../server/queries";

const REQUEST_STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  DRAFT: "outline",
  SUBMITTED: "default",
  UNDER_REVIEW: "default",
  COUNSELLING_SCHEDULED: "default",
  WAITING_FOR_PAYMENT: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  CANCELLED: "outline",
  COMPLETED: "success",
};

const ORDER_STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "destructive",
  CANCELLED: "outline",
  REFUNDED: "outline",
};

/** Reads status off the source record (request or order) - OperationItem never stores its own, see the schema comment. */
function OperationStatusBadge({ item }: { item: OperationItemWithRelations }) {
  if (item.type === "REQUEST" && item.request) {
    return (
      <Badge variant={REQUEST_STATUS_VARIANT[item.request.status] ?? "default"}>
        {getRequestStageLabel(item.request.status, item.request.requestType)}
      </Badge>
    );
  }
  if (item.type === "ORDER" && item.order) {
    return (
      <Badge variant={ORDER_STATUS_VARIANT[item.order.status] ?? "default"}>
        {ORDER_STAGE_LABEL[item.order.status]}
      </Badge>
    );
  }
  return <Badge variant="outline">Unknown</Badge>;
}

export { OperationStatusBadge };
