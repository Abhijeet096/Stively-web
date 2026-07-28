import type { SalesProjectPaymentStatus } from "@prisma/client";

export const PAYMENT_STATUS_LABEL: Record<SalesProjectPaymentStatus, string> = {
  PENDING: "Upcoming",
  DUE: "Due",
  PAID: "Paid",
};

export const PAYMENT_STATUS_VARIANT: Record<SalesProjectPaymentStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  PENDING: "secondary",
  DUE: "warning",
  PAID: "success",
};
