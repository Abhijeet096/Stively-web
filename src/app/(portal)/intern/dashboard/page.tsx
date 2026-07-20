import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SimplePlaceholderDashboard } from "@/components/dashboard-shell/widgets/simple-placeholder-dashboard";

export const metadata: Metadata = { title: "Intern Dashboard" };

export default async function InternDashboardPage() {
  const user = await requireRole("INTERN");

  return (
    <>
      <SetPageTitle title="Intern Dashboard" />
      <SimplePlaceholderDashboard
        user={user}
        description="Internship tasks, check-ins, and progress tracking are coming to this dashboard."
      />
    </>
  );
}
