import type { Role } from "@prisma/client";
import { Sparkles } from "lucide-react";

import { ROLE_LABEL } from "@/config/rbac";
import { DashboardCard } from "@/components/dashboard-shell/widgets/dashboard-card";
import { Container } from "@/components/shared/container";

export interface SimplePlaceholderDashboardProps {
  user: { name?: string | null; role: Role };
  description: string;
}

/**
 * The shared "simple placeholder dashboard" the brief asks for on Mentor
 * (and, by the same treatment, Company/Intern/Team - none of which were
 * detailed further in this phase). One component instead of four
 * near-identical page bodies - a role's real dashboard replaces the call
 * site, not this component, once that role's features are actually built.
 */
function SimplePlaceholderDashboard({ user, description }: SimplePlaceholderDashboardProps) {
  const firstName = user.name?.split(" ")[0];

  return (
    <Container size="narrow" className="flex flex-col items-center gap-6 py-20 text-center">
      <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
        <Sparkles className="size-6" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Welcome{firstName ? `, ${firstName}` : ""}
        </h2>
        <p className="text-muted-foreground max-w-md text-pretty">{description}</p>
      </div>
      <DashboardCard className="w-full max-w-sm text-left">
        <p className="text-foreground text-sm font-medium">{ROLE_LABEL[user.role]} dashboard</p>
        <p className="text-muted-foreground text-sm text-pretty">
          Full features for this role are on the roadmap - this page confirms your account, role,
          and access are all working correctly.
        </p>
      </DashboardCard>
    </Container>
  );
}

export { SimplePlaceholderDashboard };
