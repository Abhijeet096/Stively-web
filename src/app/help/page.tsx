import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";

import { requireUser } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell/layout/dashboard-shell";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Help Center", robots: { index: false, follow: false } };

/** Role-agnostic placeholder - a real help center (articles, a ticket/contact flow) is future work; reuses /contact today rather than building a second, duplicate support channel. */
export default async function HelpPage() {
  const user = await requireUser();

  return (
    <DashboardShell user={user} defaultTitle="Help Center">
      <SetPageTitle title="Help Center" />
      <Container size="narrow" className="py-8">
        <EmptyState
          icon={LifeBuoy}
          title="Help Center is coming soon"
          description="In the meantime, reach out and a real person will get back to you."
          actionLabel="Contact support"
          actionHref="/contact"
        />
      </Container>
    </DashboardShell>
  );
}
