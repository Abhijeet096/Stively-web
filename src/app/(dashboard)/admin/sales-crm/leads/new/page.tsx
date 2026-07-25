import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { getSalesTeamMembers } from "@/features/sales-crm/server/queries";
import { SalesLeadForm } from "@/features/sales-crm/components/admin/sales-lead-form";

export const metadata: Metadata = { title: "Add Lead" };

export default async function NewSalesLeadPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const teamMembers = await getSalesTeamMembers();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Add lead</h1>
        <p className="text-muted-foreground text-sm">Add a new B2B prospect to the sales pipeline.</p>
      </div>
      <SalesLeadForm teamMembers={teamMembers} />
    </div>
  );
}
