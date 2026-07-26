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
  getOfferingsForQuotePicker,
} from "@/features/sales-crm/server/queries";
import { getAllTeamMembers } from "@/lib/queries/team-members";
import { SalesLeadDetail } from "@/features/sales-crm/components/admin/sales-lead-detail";
import { ConvertToProjectDialog } from "@/features/sales-crm/components/admin/convert-to-project-dialog";

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

  const [activities, notes, attachments, followUps, quotes, offerings, teamMembers, allTeamMembers] = await Promise.all([
    getSalesLeadTimeline(id),
    getSalesLeadNotes(id),
    getSalesLeadAttachments(id),
    getFollowUpsForLead(id),
    getQuotesForLead(id),
    getOfferingsForQuotePicker(),
    getSalesTeamMembers(),
    getAllTeamMembers(),
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
        offerings={offerings}
        teamMembers={teamMembers}
        convertPanel={<ConvertToProjectDialog salesLeadId={lead.id} suggestedValue={lead.estimatedValue} teamMembers={allTeamMembers} />}
      />
    </div>
  );
}
