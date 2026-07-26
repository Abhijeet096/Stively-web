import type { BusinessStatus, BusinessDataSource, WebsiteAnalysisStatus } from "@prisma/client";

export const BUSINESS_STATUS_LABEL: Record<BusinessStatus, string> = {
  NEW: "New",
  ANALYZED: "Analyzed",
  PROMOTED: "Promoted",
  DISMISSED: "Dismissed",
};

export const BUSINESS_STATUS_VARIANT: Record<BusinessStatus, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  NEW: "secondary",
  ANALYZED: "default",
  PROMOTED: "success",
  DISMISSED: "destructive",
};

export const BUSINESS_DATA_SOURCE_LABEL: Record<BusinessDataSource, string> = {
  GOOGLE_PLACES: "Google Places",
  WEBSITE: "Website scan",
  MANUAL_IMPORT: "CSV import",
  MANUAL_ENTRY: "Manual entry",
};

export const WEBSITE_ANALYSIS_STATUS_LABEL: Record<WebsiteAnalysisStatus, string> = {
  PENDING: "Pending",
  ANALYZING: "Analyzing",
  COMPLETE: "Complete",
  FAILED: "Failed",
};

export function opportunityScoreTier(score: number): { label: string; variant: "success" | "warning" | "destructive" | "secondary" } {
  if (score >= 75) return { label: "High", variant: "success" };
  if (score >= 45) return { label: "Medium", variant: "warning" };
  return { label: "Low", variant: "destructive" };
}
