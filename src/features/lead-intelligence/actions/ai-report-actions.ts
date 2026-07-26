"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { generateBusinessReport, BusinessNotFoundError } from "../server/generate-report";

export type GenerateAIReportResult = ActionResult & { reportId?: string; opportunityScore?: number };

/** Manual (re-)generation trigger - an admin/salesperson can re-run this any time (e.g. after re-analyzing an improved website) to get a fresh report. */
export async function generateAIReport(businessId: string): Promise<GenerateAIReportResult> {
  await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  try {
    const report = await generateBusinessReport(businessId);
    revalidatePath(`/admin/lead-intelligence/businesses/${businessId}`);
    return { success: true, reportId: report.id, opportunityScore: report.opportunityScore };
  } catch (error) {
    if (error instanceof BusinessNotFoundError) {
      return { success: false, error: "Business not found." };
    }
    console.error("generateAIReport failed:", error);
    return { success: false, error: "Something went wrong generating the report. Please try again." };
  }
}
