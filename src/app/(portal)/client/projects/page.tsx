import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";
import { resolveClientWorkspaceViewer } from "@/features/client-workspace/server/rbac";
import { getClientWorkspaces } from "@/features/client-workspace/server/queries";
import { ClientWorkspaceCard } from "@/features/client-workspace/components/client/client-workspace-card";

export const metadata: Metadata = { title: "Current Projects" };

export default async function ClientProjectsPage() {
  const user = await requireRole("CLIENT");

  const viewer = await resolveClientWorkspaceViewer(user.id);
  const workspaces = await getClientWorkspaces(viewer);

  return (
    <>
      <SetPageTitle title="Current Projects" />
      <Container className="flex flex-col gap-8 py-8">
        <SectionHeader title="Current Projects" description="Your proposal, documents, and project progress, all in one place." />

        {workspaces.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No active projects"
            description="Once a project kicks off, you'll be able to track its progress here."
            actionLabel="Request Proposal"
            actionHref="/client/offerings"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {workspaces.map((lead) => (
              <ClientWorkspaceCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
