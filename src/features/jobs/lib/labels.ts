import type { JobStatus } from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
  CLOSED: "Closed",
};

export const JOB_STATUS_VARIANT: Record<JobStatus, NonNullable<BadgeProps["variant"]>> = {
  DRAFT: "outline",
  PUBLISHED: "success",
  ARCHIVED: "secondary",
  CLOSED: "destructive",
};
