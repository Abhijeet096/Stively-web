import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { requireUser } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell/layout/dashboard-shell";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

/** Role-agnostic placeholder - account/notification/security settings are future work once there's a real settings data model to back them. */
export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <DashboardShell user={user} defaultTitle="Settings">
      <SetPageTitle title="Settings" />
      <Container size="narrow" className="py-8">
        <EmptyState
          icon={Settings}
          title="Settings are coming soon"
          description="Account, notification, and security preferences will live here."
        />
      </Container>
    </DashboardShell>
  );
}
