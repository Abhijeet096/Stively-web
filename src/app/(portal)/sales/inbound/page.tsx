import type { Metadata } from "next";
import { Inbox, UserCheck } from "lucide-react";

import { requireRole } from "@/lib/session";
import { getInboundLeadsForViewer } from "@/lib/queries/leads";
import { resolveLeadViewer } from "@/features/leads/server/rbac";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/sections/empty-state";
import { InboundLeadCard } from "@/features/leads/components/inbound-lead-card";

export const metadata: Metadata = { title: "Inbound Leads" };

/**
 * The Uber/Ola-style claim queue for plain Leads (Contact/Start Project/
 * etc.) - deliberately separate from /sales/leads, which is a different
 * model (SalesLead, the cold-call CRM pipeline). Every Role.SALES rep sees
 * every unclaimed lead here; once claimed, it drops out of every other
 * rep's view (see getInboundLeadsForViewer).
 */
export default async function InboundLeadsPage() {
  const user = await requireRole("SALES");
  const viewer = await resolveLeadViewer(user.id);
  const { unclaimed, mine } = await getInboundLeadsForViewer(viewer.teamMemberId);

  return (
    <>
      <SetPageTitle title="Inbound Leads" />
      <Container className="flex flex-col gap-10 py-8">
        {!viewer.canClaim && (
          <p className="text-muted-foreground text-sm">
            Your sales profile isn&apos;t fully set up yet - contact an admin to claim leads.
          </p>
        )}

        <div className="flex flex-col gap-4">
          <SectionHeader
            title="Unclaimed leads"
            description="First to claim it owns it. Everyone on the sales team sees this list."
          />
          {unclaimed.length === 0 ? (
            <EmptyState icon={Inbox} title="No unclaimed leads" description="New leads will show up here as they come in." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unclaimed.map((lead) => (
                <InboundLeadCard key={lead.id} lead={lead} claimable={viewer.canClaim} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeader title="My claimed leads" description="Leads only you and the admin can see." />
          {mine.length === 0 ? (
            <EmptyState icon={UserCheck} title="No claimed leads yet" description="Claim a lead above to see it here." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((lead) => (
                <InboundLeadCard key={lead.id} lead={lead} claimable={false} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
