"use server";

import { requireRole } from "@/lib/session";
import { resolveSalesCrmViewer } from "../server/rbac";
import { getAllSalesLeadsForExport, type SalesLeadFilters, type SalesLeadWithOwner } from "../server/queries";

export type ExportSalesLeadsResult = { success: true; leads: SalesLeadWithOwner[] } | { success: false; error: string };

/** Server Action wrapper so the client-side "Export CSV" button can fetch the full filtered set (not just the current page) without a dedicated API route. */
export async function exportSalesLeads(filters: SalesLeadFilters): Promise<ExportSalesLeadsResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const leads = await getAllSalesLeadsForExport(filters, viewer);
    return { success: true, leads };
  } catch (error) {
    console.error("exportSalesLeads failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
