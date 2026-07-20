import {
  Radio,
  UserRound,
  Clock,
  Users,
  Video,
  Link2,
  Mail,
  CheckCircle2,
  CheckCheck,
  XCircle,
  Ban,
  type LucideIcon,
} from "lucide-react";
import type { LiveSessionType, LiveSessionProvider, AttendeeStatus, LiveSessionStatus } from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const SESSION_TYPE_LABEL: Record<LiveSessionType, string> = {
  LIVE_CLASS: "Live class",
  ONE_ON_ONE: "1:1 session",
  OFFICE_HOURS: "Office hours",
  GROUP_MENTORING: "Group mentoring",
};

export const SESSION_TYPE_ICON: Record<LiveSessionType, LucideIcon> = {
  LIVE_CLASS: Radio,
  ONE_ON_ONE: UserRound,
  OFFICE_HOURS: Clock,
  GROUP_MENTORING: Users,
};

/** Mentor-led session types only - LIVE_CLASS stays curriculum-bound, created via the admin learning CMS instead. */
export const MENTOR_SESSION_TYPES: LiveSessionType[] = ["ONE_ON_ONE", "OFFICE_HOURS", "GROUP_MENTORING"];

export const SESSION_PROVIDER_LABEL: Record<LiveSessionProvider, string> = {
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
  OTHER: "Other",
};

export const SESSION_PROVIDER_ICON: Record<LiveSessionProvider, LucideIcon> = {
  GOOGLE_MEET: Video,
  ZOOM: Video,
  OTHER: Link2,
};

export const ATTENDEE_STATUS_LABEL: Record<AttendeeStatus, string> = {
  INVITED: "Invited",
  CONFIRMED: "Confirmed",
  ATTENDED: "Attended",
  NO_SHOW: "No-show",
  CANCELLED: "Cancelled",
};

export const ATTENDEE_STATUS_ICON: Record<AttendeeStatus, LucideIcon> = {
  INVITED: Mail,
  CONFIRMED: CheckCircle2,
  ATTENDED: CheckCheck,
  NO_SHOW: XCircle,
  CANCELLED: Ban,
};

export const SESSION_STATUS_LABEL: Record<LiveSessionStatus, string> = {
  SCHEDULED: "Scheduled",
  LIVE: "Live now",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SESSION_STATUS_BADGE_VARIANT: Record<LiveSessionStatus, BadgeProps["variant"]> = {
  SCHEDULED: "default",
  LIVE: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};
