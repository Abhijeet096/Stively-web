import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SimplePlaceholderDashboard } from "@/components/dashboard-shell/widgets/simple-placeholder-dashboard";

export const metadata: Metadata = { title: "Team Dashboard" };

export default async function TeamDashboardPage() {
  const user = await requireRole("TEAM_MEMBER");

  return (
    <>
      <SetPageTitle title="Team Dashboard" />
      <SimplePlaceholderDashboard
        user={user}
        description="Internal team tools for day-to-day work at Stively are coming to this dashboard."
      />
    </>
  );
}
