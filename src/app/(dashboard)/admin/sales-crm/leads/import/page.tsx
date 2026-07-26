import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { getSalesTeamMembers } from "@/features/sales-crm/server/queries";
import { LeadImportWizard } from "@/features/sales-crm/components/admin/lead-import-wizard";

export const metadata: Metadata = { title: "Import Leads" };

export default async function ImportSalesLeadsPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const teamMembers = await getSalesTeamMembers();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Import leads</h1>
        <p className="text-muted-foreground text-sm">Bring leads in from a CSV file - exported from Google Sheets or Excel.</p>
      </div>
      <LeadImportWizard teamMembers={teamMembers} />
    </div>
  );
}
