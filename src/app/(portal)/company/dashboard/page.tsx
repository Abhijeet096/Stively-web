import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SimplePlaceholderDashboard } from "@/components/dashboard-shell/widgets/simple-placeholder-dashboard";

export const metadata: Metadata = { title: "Company Dashboard" };

export default async function CompanyDashboardPage() {
  const user = await requireRole("COMPANY");

  return (
    <>
      <SetPageTitle title="Company Dashboard" />
      <SimplePlaceholderDashboard
        user={user}
        description="Company-level tools for managing your organization's engagement with Stively are coming soon."
      />
    </>
  );
}
