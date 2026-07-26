import Link from "next/link";
import { Mail, Phone, MessageCircle, Globe, MapPin, Landmark, Briefcase } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { formatSalesLeadNumber } from "../../lib/reference-number";
import { LEAD_PRIORITY_LABEL, LEAD_PRIORITY_VARIANT, SALES_LEAD_SOURCE_LABEL } from "../../lib/labels";
import { SalesLeadStatusChanger } from "./sales-lead-status-changer";
import { SalesLeadLostReason } from "./sales-lead-lost-reason";
import { SalesLeadOwnerPanel } from "./sales-lead-owner-panel";
import { SalesLeadOutreachPanel } from "./sales-lead-outreach-panel";
import { DiscoveryChecklistPanel, type DiscoveryOfferingOption } from "@/features/proposals/components/admin/discovery-checklist-panel";
import { ProposalSummaryPanel } from "@/features/proposals/components/admin/proposal-summary-panel";
import { computeProposalReadiness } from "@/features/proposals/server/discovery-queries";
import type { Proposal } from "@prisma/client";
import { SalesLeadNotesPanel } from "./sales-lead-notes-panel";
import { SalesLeadAttachmentsPanel } from "./sales-lead-attachments-panel";
import { SalesLeadTimeline } from "./sales-lead-timeline";
import { SalesFollowUpsPanel } from "./sales-follow-ups-panel";
import { SalesQuotesPanel } from "./sales-quotes-panel";
import type {
  getSalesLeadById,
  getSalesLeadTimeline,
  getSalesLeadNotes,
  getSalesLeadAttachments,
  getFollowUpsForLead,
  getQuotesForLead,
  OfferingForQuote,
} from "../../server/queries";
import type { TeamMember, SalesLeadDiscovery } from "@prisma/client";

type SalesLead = NonNullable<Awaited<ReturnType<typeof getSalesLeadById>>>;

export interface SalesLeadDetailProps {
  lead: SalesLead;
  activities: Awaited<ReturnType<typeof getSalesLeadTimeline>>;
  notes: Awaited<ReturnType<typeof getSalesLeadNotes>>;
  attachments: Awaited<ReturnType<typeof getSalesLeadAttachments>>;
  followUps: Awaited<ReturnType<typeof getFollowUpsForLead>>;
  quotes: Awaited<ReturnType<typeof getQuotesForLead>>;
  offerings: OfferingForQuote[];
  discovery: SalesLeadDiscovery | null;
  activeProposal: Proposal | null;
  teamMembers: TeamMember[];
  /** Base path for the "View project" link - differs between the admin CMS and the /sales portal. */
  basePath?: string;
  /** Base path for the proposal workspace link (`${proposalBasePath}/leads/${id}/proposal`) - differs between the admin CMS and the /sales portal. */
  proposalBasePath?: string;
  /** Reassignment is Admin/Super Admin-only (see reassignSalesLead) - the /sales portal shows ownership read-only instead of a Reassign button that would always fail. */
  canReassign?: boolean;
  /** Rendered in place of the plain "ready to convert" hint when the lead is WON and un-converted - Admin/Super Admin-only (see convertLeadToProject), so the /sales portal omits this prop entirely. */
  convertPanel?: React.ReactNode;
}

function InfoRow({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="text-foreground">{children}</span>
    </div>
  );
}

function SalesLeadDetail({
  lead,
  activities,
  notes,
  attachments,
  followUps,
  quotes,
  offerings,
  discovery,
  activeProposal,
  teamMembers,
  basePath = "/admin/sales-crm/projects",
  proposalBasePath = "/admin/sales-crm",
  canReassign = true,
  convertPanel,
}: SalesLeadDetailProps) {
  const readiness = computeProposalReadiness(discovery);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">{lead.businessName}</h1>
            <Badge variant={LEAD_PRIORITY_VARIANT[lead.priority]}>{LEAD_PRIORITY_LABEL[lead.priority]} priority</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {formatSalesLeadNumber(lead.sequence)} · {lead.ownerName} · {SALES_LEAD_SOURCE_LABEL[lead.source]}
          </p>
        </div>
        {lead.project && (
          <Button variant="outline" asChild>
            <Link href={`${basePath}/${lead.project.id}`}>View project</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Business details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2.5 sm:grid-cols-2">
              <InfoRow icon={Phone}>{lead.phone}</InfoRow>
              <InfoRow icon={MessageCircle}>{lead.whatsapp}</InfoRow>
              <InfoRow icon={Mail}>{lead.email}</InfoRow>
              <InfoRow icon={Globe}>{lead.website}</InfoRow>
              <InfoRow icon={Briefcase}>{lead.industry}</InfoRow>
              <InfoRow icon={Landmark}>{lead.gstNumber}</InfoRow>
              <InfoRow icon={MapPin}>{[lead.address, lead.city, lead.state, lead.country].filter(Boolean).join(", ")}</InfoRow>
              {lead.estimatedValue != null && (
                <div className="text-muted-foreground text-sm">
                  Estimated value: <span className="text-foreground font-medium">{formatPrice(lead.estimatedValue)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <DiscoveryChecklistPanel salesLeadId={lead.id} discovery={discovery} offerings={offerings as DiscoveryOfferingOption[]} />

          <ProposalSummaryPanel
            salesLeadId={lead.id}
            activeProposal={activeProposal}
            readiness={readiness}
            workspaceBasePath={proposalBasePath}
          />

          <SalesLeadOutreachPanel
            salesLeadId={lead.id}
            outreach={lead.outreach[0]}
            whatsappOrPhone={lead.whatsapp || lead.phone}
            phone={lead.phone}
            email={lead.email}
          />
          <SalesFollowUpsPanel salesLeadId={lead.id} followUps={followUps} teamMembers={teamMembers} defaultAssigneeId={lead.assignedToId ?? undefined} />
          <SalesQuotesPanel salesLeadId={lead.id} leadEmail={lead.email} quotes={quotes} offerings={offerings} />
          <SalesLeadNotesPanel salesLeadId={lead.id} notes={notes} />
          <SalesLeadAttachmentsPanel salesLeadId={lead.id} attachments={attachments} />
          <SalesLeadTimeline activities={activities} />
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesLeadStatusChanger salesLeadId={lead.id} currentStatus={lead.status} />
              {lead.status === "WON" &&
                !lead.project &&
                (convertPanel ?? <p className="text-success mt-3 text-xs">Ready to convert to a project.</p>)}
              {lead.status === "LOST" && <SalesLeadLostReason salesLeadId={lead.id} currentReason={lead.lostReason} />}
            </CardContent>
          </Card>

          {canReassign ? (
            <SalesLeadOwnerPanel salesLeadId={lead.id} currentOwner={lead.assignedTo} teamMembers={teamMembers} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Salesperson</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-foreground text-sm">{lead.assignedTo?.name ?? "Unassigned"}</span>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export { SalesLeadDetail };
