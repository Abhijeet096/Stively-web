import type { Metadata } from "next";
import { Compass } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Career Guidance" };

/** Placeholder - reuses the existing lead-capture flow for now rather than a separate, unbuilt advisory system. */
export default async function CareerGuidancePage() {
  await requireRole("STUDENT");

  return (
    <>
      <SetPageTitle title="Career Guidance" />
      <Container className="py-8">
        <EmptyState
          icon={Compass}
          title="Career guidance, one conversation away"
          description="Request a callback and we'll connect you with someone who can help you plan your next step."
          actionLabel="Request a callback"
          actionHref="/contact"
        />
      </Container>
    </>
  );
}
