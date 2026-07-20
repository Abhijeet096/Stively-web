import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getLeadById, getLeadTimeline, getLeadNotes } from "@/lib/queries/leads";
import { getAllTeamMembers } from "@/lib/queries/team-members";
import { formatPrice } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge } from "@/components/dashboard/lead-status-badge";
import { LeadTimeline } from "@/components/dashboard/lead-timeline";
import { LeadNotes } from "@/components/dashboard/lead-notes";
import { LeadUpdateForm } from "@/components/dashboard/lead-update-form";
import { LeadOwnerPanel } from "@/components/dashboard/lead-owner-panel";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LeadDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const lead = await getLeadById(id);
  return { title: lead ? lead.name : "Lead not found" };
}

/**
 * "The central CRM screen," per this task's own framing - everything a
 * Founder needs to work a lead lives here. Data fetched in parallel
 * (lead, timeline, notes, team members all independent), and notFound()
 * handles an invalid id the same way Program Detail already does for
 * program slugs - reusing that established pattern, not inventing a new
 * one for leads.
 */
export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  const [lead, timeline, notes, teamMembers] = await Promise.all([
    getLeadById(id),
    getLeadTimeline(id),
    getLeadNotes(id),
    getAllTeamMembers(),
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/leads" aria-label="Back to leads">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{lead.name}</h1>
        <LeadStatusBadge status={lead.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lead information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs tracking-wide uppercase">Email</dt>
                  <dd className="text-foreground text-sm">{lead.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs tracking-wide uppercase">Phone</dt>
                  <dd className="text-foreground text-sm">{lead.phone ?? "—"}</dd>
                </div>

                {lead.leadType === "BUSINESS" && (
                  <div>
                    <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                      Company
                    </dt>
                    <dd className="text-foreground text-sm">{lead.companyName ?? "—"}</dd>
                  </div>
                )}
                {lead.leadType === "BUSINESS" && lead.estimatedValue != null && (
                  <div>
                    <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                      Estimated value
                    </dt>
                    <dd className="text-foreground text-sm">{formatPrice(lead.estimatedValue)}</dd>
                  </div>
                )}

                {lead.leadType === "STUDENT" && lead.program && (
                  <div>
                    <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                      Program interest
                    </dt>
                    <dd className="text-foreground text-sm">{lead.program.title}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-muted-foreground text-xs tracking-wide uppercase">Created</dt>
                  <dd className="text-foreground text-sm">
                    {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                      lead.createdAt
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                    Last enquiry
                  </dt>
                  <dd className="text-foreground text-sm">
                    {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                      lead.lastEnquiryAt
                    )}
                  </dd>
                </div>

                {lead.message && (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                      Message
                    </dt>
                    <dd className="text-foreground text-sm whitespace-pre-line">{lead.message}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <LeadTimeline history={timeline} />
          <LeadNotes leadId={lead.id} notes={notes} />
        </div>

        <div className="flex flex-col gap-6">
          <LeadOwnerPanel
            leadId={lead.id}
            currentOwner={lead.currentOwner}
            teamMembers={teamMembers}
          />

          <Card>
            <CardHeader>
              <CardTitle>Update lead</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadUpdateForm lead={lead} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
