import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getActiveProposalForLead } from "@/features/proposals/server/proposal-queries";
import { getProposalEngagement } from "@/features/proposals/server/analytics-queries";
import { ProposalWorkspace } from "@/features/proposals/components/admin/proposal-workspace";
import { siteConfig } from "@/config/site";

interface ProposalWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Proposal Workspace" };

export default async function AdminProposalWorkspacePage({ params }: ProposalWorkspacePageProps) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const { id } = await params;

  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const proposal = await getActiveProposalForLead(id, viewer);
  if (!proposal) notFound();
  const engagement = await getProposalEngagement(proposal.id, viewer);

  return (
    <div className="p-6">
      <ProposalWorkspace proposal={proposal} proposalUrl={`${siteConfig.url}/proposal/${proposal.token}`} engagement={engagement} />
    </div>
  );
}
