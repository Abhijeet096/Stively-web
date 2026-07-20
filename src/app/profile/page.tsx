import type { Metadata } from "next";
import { User } from "lucide-react";

import { requireUser } from "@/lib/session";
import { ROLE_LABEL } from "@/config/rbac";
import { DashboardShell } from "@/components/dashboard-shell/layout/dashboard-shell";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { DashboardCard } from "@/components/dashboard-shell/widgets/dashboard-card";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

/**
 * Role-agnostic - any authenticated user reaches this from ProfileDropdown
 * (src/components/dashboard-shell/profile/profile-dropdown.tsx), regardless
 * of which portal they otherwise live in. Read-only for now; editable
 * profile fields are future work once there's a real profile data model
 * beyond name/email/role.
 */
export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <DashboardShell user={user} defaultTitle="Profile">
      <SetPageTitle title="Profile" />
      <Container size="narrow" className="flex flex-col gap-6 py-8">
        <DashboardCard className="items-center text-center">
          <span className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full text-xl font-semibold">
            {user.name ? user.name.slice(0, 2).toUpperCase() : <User className="size-6" />}
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-foreground text-lg font-semibold">{user.name ?? "Your account"}</p>
            {user.email && <p className="text-muted-foreground text-sm">{user.email}</p>}
            <p className="text-muted-foreground text-sm">{ROLE_LABEL[user.role]}</p>
          </div>
        </DashboardCard>
      </Container>
    </DashboardShell>
  );
}
