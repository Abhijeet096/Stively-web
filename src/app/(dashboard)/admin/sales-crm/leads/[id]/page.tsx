import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import {
  getSalesLeadById,
  getSalesLeadTimeline,
  getSalesLeadNotes,
  getSalesLeadAttachments,
  getFollowUpsForLead,
  getSalesTeamMembers,
  getQuotesForLead,
  getMeetingsForLead,
  getMessagesForLead,
  getOfferingsForQuotePicker,
} from "@/features/sales-crm/server/queries";
import { getAllTeamMembers } from "@/lib/queries/team-members";
import { SalesLeadDetail } from "@/features/sales-crm/components/admin/sales-lead-detail";
import { ConvertToProjectDialog } from "@/features/sales-crm/components/admin/convert-to-project-dialog";
import { getSalesLeadDiscovery } from "@/features/proposals/server/discovery-queries";
import { getAcceptedProposalPackagePrice, getActiveProposalForLead } from "@/features/proposals/server/proposal-queries";
import { getClientDocumentsForLead } from "@/features/client-workspace/server/queries";

interface SalesLeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Lead Detail" };

export default async function SalesLeadDetailPage({ params }: SalesLeadDetailPageProps) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const { id } = await params;

  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const lead = await getSalesLeadById(id, viewer);
  if (!lead) notFound();

  const [activities, notes, attachments, followUps, quotes, meetings, messages, offerings, discovery, teamMembers, allTeamMembers, acceptedPackagePrice, activeProposal, clientDocuments] =
    await Promise.all([
      getSalesLeadTimeline(id),
      getSalesLeadNotes(id),
      getSalesLeadAttachments(id),
      getFollowUpsForLead(id),
      getQuotesForLead(id),
      getMeetingsForLead(id),
      getMessagesForLead(id),
      getOfferingsForQuotePicker(),
      getSalesLeadDiscovery(id),
      getSalesTeamMembers(),
      getAllTeamMembers(),
      getAcceptedProposalPackagePrice(id),
      getActiveProposalForLead(id, viewer),
      getClientDocumentsForLead(id, viewer),
    ]);

  return (
    <div className="p-6">
      <SalesLeadDetail
        lead={lead}
        activities={activities}
        notes={notes}
        attachments={attachments}
        followUps={followUps}
        quotes={quotes}
        meetings={meetings}
        messages={messages}
        currentUserId={user.id}
        offerings={offerings}
        discovery={discovery}
        activeProposal={activeProposal}
        teamMembers={teamMembers}
        clientDocuments={clientDocuments}
        convertPanel={
          <ConvertToProjectDialog salesLeadId={lead.id} suggestedValue={acceptedPackagePrice ?? lead.estimatedValue} teamMembers={allTeamMembers} />
        }
      />
    </div>
  );
}
