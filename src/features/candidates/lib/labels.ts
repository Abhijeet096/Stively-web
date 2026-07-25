import type { InterviewLinkStatus } from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const LINK_STATUS_LABEL: Record<InterviewLinkStatus, string> = {
  PENDING: "Not opened",
  SENT: "Sent",
  OPENED: "Opened",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
};

export const LINK_STATUS_VARIANT: Record<InterviewLinkStatus, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "outline",
  SENT: "secondary",
  OPENED: "default",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  EXPIRED: "destructive",
};
