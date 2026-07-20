import type { OfferingEnrollmentStatus } from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const ENROLLMENT_STATUS_LABEL: Record<OfferingEnrollmentStatus, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export const ENROLLMENT_STATUS_BADGE_VARIANT: Record<OfferingEnrollmentStatus, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "outline",
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "success",
  CANCELLED: "outline",
  EXPIRED: "destructive",
};
