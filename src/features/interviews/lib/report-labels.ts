import type { InterviewStatus, Recommendation } from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const INTERVIEW_STATUS_LABEL: Record<InterviewStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

export const INTERVIEW_STATUS_VARIANT: Record<InterviewStatus, NonNullable<BadgeProps["variant"]>> = {
  NOT_STARTED: "outline",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  ABANDONED: "destructive",
};

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  STRONG_HIRE: "Strong hire",
  HIRE: "Hire",
  HOLD: "Hold",
  REJECT: "Reject",
};

export const RECOMMENDATION_VARIANT: Record<Recommendation, NonNullable<BadgeProps["variant"]>> = {
  STRONG_HIRE: "success",
  HIRE: "success",
  HOLD: "warning",
  REJECT: "destructive",
};
