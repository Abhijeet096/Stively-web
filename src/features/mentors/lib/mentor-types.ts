import { Building2, Globe, Award, Briefcase, GraduationCap, type LucideIcon } from "lucide-react";
import type { MentorType, MentorAssignmentStatus } from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const MENTOR_TYPE_LABEL: Record<MentorType, string> = {
  INTERNAL: "Internal mentor",
  EXTERNAL: "External mentor",
  INDUSTRY_EXPERT: "Industry expert",
  CORPORATE: "Corporate mentor",
  INTERNSHIP_SUPERVISOR: "Internship supervisor",
};

export const MENTOR_TYPE_ICON: Record<MentorType, LucideIcon> = {
  INTERNAL: Building2,
  EXTERNAL: Globe,
  INDUSTRY_EXPERT: Award,
  CORPORATE: Briefcase,
  INTERNSHIP_SUPERVISOR: GraduationCap,
};

export const MENTOR_ASSIGNMENT_STATUS_LABEL: Record<MentorAssignmentStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  ENDED: "Ended",
};

export const MENTOR_ASSIGNMENT_STATUS_BADGE_VARIANT: Record<MentorAssignmentStatus, BadgeProps["variant"]> = {
  ACTIVE: "success",
  PAUSED: "warning",
  ENDED: "secondary",
};
