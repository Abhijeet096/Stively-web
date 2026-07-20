import type { OrderStatus } from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const ORDER_STATUS_BADGE_VARIANT: Record<OrderStatus, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "outline",
  PAID: "success",
  FAILED: "destructive",
  CANCELLED: "outline",
  REFUNDED: "warning",
};
