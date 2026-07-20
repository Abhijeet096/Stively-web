import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Support" };

/** Reuses the existing /contact lead-capture flow rather than a second, parallel support ticket system. */
export default async function StudentSupportPage() {
  await requireRole("STUDENT");

  return (
    <>
      <SetPageTitle title="Support" />
      <Container className="py-8">
        <EmptyState
          icon={LifeBuoy}
          title="Need a hand with something?"
          description="Send us a message and a real person will get back to you - usually within a day."
          actionLabel="Contact support"
          actionHref="/contact"
        />
      </Container>
    </>
  );
}
