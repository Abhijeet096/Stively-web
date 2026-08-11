import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type {
  ClientDocument,
  DiscoveryForm,
  Offering,
  ProjectMilestone,
  ProjectUpdate,
  SalesLead,
  SalesLeadMeeting,
  SalesLeadMessage,
  SalesProject,
  SalesProjectPayment,
  SalesQuote,
  TeamMember,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getWorkspacePhase } from "../../lib/workspace-status";
import { SALES_PROJECT_STATUS_LABEL, SALES_PROJECT_STATUS_VARIANT } from "@/features/sales-crm/lib/labels";
import { ClientDocumentsList } from "./client-documents-list";
import { ClientQuotesList } from "./client-quotes-list";
import { ClientMeetingList } from "./client-meeting-list";
import { ClientDiscoveryForms } from "@/features/discovery-forms/components/client/client-discovery-forms";
import { SalesLeadMessageThread } from "../shared/sales-lead-message-thread";
import { sendMessageToStaffContent } from "../../actions/message-actions";

export type ProjectWithWorkspaceRelations = SalesProject & {
  payments: SalesProjectPayment[];
  updates: ProjectUpdate[];
  milestones: ProjectMilestone[];
};

type QuoteWithRelations = SalesQuote & { offering: Pick<Offering, "title"> | null; createdBy: Pick<TeamMember, "name"> | null };

export interface ClientWorkspaceDetailProps {
  lead: SalesLead & {
    projects: ProjectWithWorkspaceRelations[];
    documents: ClientDocument[];
    quotes: QuoteWithRelations[];
    meetings: SalesLeadMeeting[];
    messages: SalesLeadMessage[];
    assignedTo: Pick<TeamMember, "name"> | null;
  };
  discoveryForms: DiscoveryForm[];
  userId: string;
}

/**
 * One business's full client-facing workspace. Documents always show
 * (delivered pre-project too). A client can have more than one project now -
 * each one's Payments/Progress/Timeline live on its own dedicated page
 * (/client/projects/[id]/[projectId]), listed here as cards rather than
 * flattened into shared tabs that would ambiguously mix installments/
 * milestones across unrelated projects.
 */
function ClientWorkspaceDetail({ lead, discoveryForms, userId }: ClientWorkspaceDetailProps) {
  const phase = getWorkspacePhase(lead.projects);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{lead.businessName}</h1>
        <Badge variant={phase.variant}>{phase.label}</Badge>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="meeting">Meeting</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="flex flex-col gap-3 pt-4">
          {lead.projects.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No projects yet - once one kicks off, you&apos;ll be able to track its progress here.
            </p>
          ) : (
            lead.projects.map((project) => (
              <Link key={project.id} href={`/client/projects/${lead.id}/${project.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{project.name}</span>
                        <Badge variant={SALES_PROJECT_STATUS_VARIANT[project.status]}>
                          {SALES_PROJECT_STATUS_LABEL[project.status]}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground text-sm">{project.progressPercent}% complete</span>
                    </div>
                    <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
        <TabsContent value="quotes" className="pt-4">
          <ClientQuotesList quotes={lead.quotes} />
        </TabsContent>
        <TabsContent value="meeting" className="pt-4">
          <ClientMeetingList meetings={lead.meetings} />
        </TabsContent>
        <TabsContent value="discovery" className="pt-4">
          <ClientDiscoveryForms forms={discoveryForms} />
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <ClientDocumentsList documents={lead.documents} />
        </TabsContent>
        <TabsContent value="messages" className="pt-4">
          <SalesLeadMessageThread
            currentUserId={userId}
            otherPartyName={lead.assignedTo?.name ?? "Stively"}
            messages={lead.messages}
            onSend={sendMessageToStaffContent.bind(null, lead.id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { ClientWorkspaceDetail };
