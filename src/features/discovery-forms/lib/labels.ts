import type { DiscoveryFormStatus } from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const DISCOVERY_FORM_STATUS_LABEL: Record<DiscoveryFormStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  OPENED: "Opened",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  REVIEWED: "Reviewed",
  EXPIRED: "Expired",
};

export const DISCOVERY_FORM_STATUS_VARIANT: Record<DiscoveryFormStatus, NonNullable<BadgeProps["variant"]>> = {
  DRAFT: "outline",
  SENT: "secondary",
  OPENED: "default",
  IN_PROGRESS: "warning",
  SUBMITTED: "success",
  REVIEWED: "success",
  EXPIRED: "destructive",
};

/** One entry per Section 3 functional-requirement checkbox - array-driven so the admin summary, the fillable form, and the read-only response view all iterate the same list instead of three hand-written copies. */
export const FUNCTIONAL_REQUIREMENT_FIELDS = [
  { key: "needsUserAccounts", label: "User accounts" },
  { key: "needsAdminDashboard", label: "Admin dashboard" },
  { key: "needsPayments", label: "Payments" },
  { key: "needsNotifications", label: "Notifications" },
  { key: "needsEmail", label: "Email" },
  { key: "needsSearch", label: "Search" },
  { key: "needsBooking", label: "Booking" },
  { key: "needsContentManagement", label: "Content management" },
  { key: "needsAnalytics", label: "Analytics" },
  { key: "needsIntegrations", label: "Third-party integrations" },
  { key: "needsAiFeatures", label: "AI features" },
  { key: "needsMobileResponsive", label: "Mobile responsiveness" },
] as const;

export type FunctionalRequirementKey = (typeof FUNCTIONAL_REQUIREMENT_FIELDS)[number]["key"];
