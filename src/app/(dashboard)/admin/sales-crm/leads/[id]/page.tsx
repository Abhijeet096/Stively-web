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
} from "@/features/sales-crm/server/queries";
import { SalesLeadDetail } from "@/features/sales-crm/components/admin/sales-lead-detail";

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

  const [activities, notes, attachments, followUps, teamMembers] = await Promise.all([
    getSalesLeadTimeline(id),
    getSalesLeadNotes(id),
    getSalesLeadAttachments(id),
    getFollowUpsForLead(id),
    getSalesTeamMembers(),
  ]);

  return (
    <div className="p-6">
      <SalesLeadDetail lead={lead} activities={activities} notes={notes} attachments={attachments} followUps={followUps} teamMembers={teamMembers} />
    </div>
  );
}
