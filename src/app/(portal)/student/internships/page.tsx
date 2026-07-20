import type { Metadata } from "next";
import { Briefcase } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Internships" };

/** Placeholder - Internship Management is future work (see the brief's "keep architecture ready for... Internship Management, do NOT implement" scope). */
export default async function StudentInternshipsPage() {
  await requireRole("STUDENT");

  return (
    <>
      <SetPageTitle title="Internships" />
      <Container className="py-8">
        <EmptyState
          icon={Briefcase}
          title="Internship listings are coming soon"
          description="We're building out internship placements - check back soon, or get in touch and we'll help you find one."
          actionLabel="Talk to us"
          actionHref="/contact"
        />
      </Container>
    </>
  );
}
