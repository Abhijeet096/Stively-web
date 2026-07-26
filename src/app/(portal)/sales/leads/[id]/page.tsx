import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
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
import { SalesLeadDetail } from "@/features/sales-crm/components/admin/sales-lead-detail";

interface SalesPortalLeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Lead Detail" };

export default async function SalesPortalLeadDetailPage({ params }: SalesPortalLeadDetailPageProps) {
  const user = await requireRole("SALES");
  const { id } = await params;

  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const lead = await getSalesLeadById(id, viewer);
  if (!lead) notFound();

  const [activities, notes, attachments, followUps, quotes, offerings, teamMembers] = await Promise.all([
    getSalesLeadTimeline(id),
    getSalesLeadNotes(id),
    getSalesLeadAttachments(id),
    getFollowUpsForLead(id),
    getQuotesForLead(id),
    getOfferingsForQuotePicker(),
    getSalesTeamMembers(),
  ]);

  return (
    <>
      <SetPageTitle title={lead.businessName} />
      <Container className="py-8">
        <SalesLeadDetail
          lead={lead}
          activities={activities}
          notes={notes}
          attachments={attachments}
          followUps={followUps}
          quotes={quotes}
          offerings={offerings}
          teamMembers={teamMembers}
          basePath="/sales/projects"
          canReassign={false}
        />
      </Container>
    </>
  );
}
