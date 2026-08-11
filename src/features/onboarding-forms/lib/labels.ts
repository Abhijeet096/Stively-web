import type { OnboardingFormStatus, OnboardingUploadField } from "@prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const ONBOARDING_FORM_STATUS_LABEL: Record<OnboardingFormStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  OPENED: "Opened",
  SUBMITTED: "Submitted",
  REVIEWED: "Reviewed",
  EXPIRED: "Expired",
};

export const ONBOARDING_FORM_STATUS_VARIANT: Record<OnboardingFormStatus, NonNullable<BadgeProps["variant"]>> = {
  DRAFT: "outline",
  SENT: "secondary",
  OPENED: "default",
  SUBMITTED: "success",
  REVIEWED: "success",
  EXPIRED: "destructive",
};

/** One entry per upload field in the design, in the order they appear across sections 3 and 5 - drives both the fillable form's file inputs and the read-only response view's file list, so both iterate the same source instead of two hand-written copies. */
export const ONBOARDING_UPLOAD_FIELDS: { key: OnboardingUploadField; label: string; multiple: boolean }[] = [
  { key: "LOGO", label: "Logo files", multiple: false },
  { key: "BRAND_GUIDELINES", label: "Brand guidelines", multiple: false },
  { key: "BRAND_IMAGE", label: "Brand images", multiple: true },
  { key: "DESIGN_FILE", label: "Existing design files", multiple: true },
  { key: "WEBSITE_COPY", label: "Website copy", multiple: false },
  { key: "CONTENT_IMAGE", label: "Images", multiple: true },
  { key: "DOCUMENT", label: "Documents", multiple: true },
];
