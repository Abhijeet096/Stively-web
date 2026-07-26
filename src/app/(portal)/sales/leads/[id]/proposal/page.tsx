import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getActiveProposalForLead } from "@/features/proposals/server/proposal-queries";
import { ProposalWorkspace } from "@/features/proposals/components/admin/proposal-workspace";
import { siteConfig } from "@/config/site";

interface SalesPortalProposalWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Proposal Workspace" };

export default async function SalesPortalProposalWorkspacePage({ params }: SalesPortalProposalWorkspacePageProps) {
  const user = await requireRole("SALES");
  const { id } = await params;

  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const proposal = await getActiveProposalForLead(id, viewer);
  if (!proposal) notFound();

  return (
    <>
      <SetPageTitle title={proposal.title} />
      <Container className="py-8">
        <ProposalWorkspace proposal={proposal} proposalUrl={`${siteConfig.url}/proposal/${proposal.token}`} />
      </Container>
    </>
  );
}
