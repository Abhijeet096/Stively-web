import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Current Projects" };

/** Placeholder - Business Project Management is future work (see the brief's explicit "keep architecture ready for... Business Project Management, do NOT implement" scope). */
export default async function ClientProjectsPage() {
  await requireRole("CLIENT");

  return (
    <>
      <SetPageTitle title="Current Projects" />
      <Container className="py-8">
        <EmptyState
          icon={FolderKanban}
          title="No active projects"
          description="Once a project kicks off, you'll be able to track its progress here."
          actionLabel="Request Proposal"
          actionHref="/contact?type=business"
        />
      </Container>
    </>
  );
}
