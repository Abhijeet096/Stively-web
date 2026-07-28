import type {
  ClientDocument,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getWorkspacePhase } from "../../lib/workspace-status";
import { ClientDocumentsList } from "./client-documents-list";
import { ClientPaymentsList } from "./client-payments-list";
import { ClientProgressFeed } from "./client-progress-feed";
import { ClientMilestoneTimeline } from "./client-milestone-timeline";
import { ClientQuotesList } from "./client-quotes-list";
import { ClientMeetingList } from "./client-meeting-list";
import { SalesLeadMessageThread } from "../shared/sales-lead-message-thread";
import { sendMessageToStaffContent } from "../../actions/message-actions";

type ProjectWithWorkspaceRelations = SalesProject & {
  payments: SalesProjectPayment[];
  updates: ProjectUpdate[];
  milestones: ProjectMilestone[];
};

type QuoteWithRelations = SalesQuote & { offering: Pick<Offering, "title"> | null; createdBy: Pick<TeamMember, "name"> | null };

export interface ClientWorkspaceDetailProps {
  lead: SalesLead & {
    project: ProjectWithWorkspaceRelations | null;
    documents: ClientDocument[];
    quotes: QuoteWithRelations[];
    meetings: SalesLeadMeeting[];
    messages: SalesLeadMessage[];
    assignedTo: Pick<TeamMember, "name"> | null;
  };
  userId: string;
  userName?: string;
  userEmail?: string;
  nonce?: string;
}

/**
 * One business's full client-facing workspace. Documents always show
 * (delivered pre-project too); Payments/Progress/Timeline only once a
 * project - and therefore real installments/updates/milestones - exists.
 */
function ClientWorkspaceDetail({ lead, userId, userName, userEmail, nonce }: ClientWorkspaceDetailProps) {
  const phase = getWorkspacePhase(lead.project);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{lead.businessName}</h1>
        <Badge variant={phase.variant}>{phase.label}</Badge>
        {lead.project && <span className="text-muted-foreground text-sm">{lead.project.progressPercent}% complete</span>}
      </div>

      <Tabs defaultValue="quotes">
        <TabsList>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="meeting">Meeting</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {lead.project && <TabsTrigger value="payments">Payments</TabsTrigger>}
          {lead.project && <TabsTrigger value="progress">Progress</TabsTrigger>}
          {lead.project && <TabsTrigger value="timeline">Timeline</TabsTrigger>}
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="quotes" className="pt-4">
          <ClientQuotesList quotes={lead.quotes} />
        </TabsContent>
        <TabsContent value="meeting" className="pt-4">
          <ClientMeetingList meetings={lead.meetings} />
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <ClientDocumentsList documents={lead.documents} />
        </TabsContent>
        {lead.project && (
          <TabsContent value="payments" className="pt-4">
            <ClientPaymentsList
              payments={lead.project.payments.map((p) => ({ ...p, documents: lead.documents.filter((d) => d.relatedPaymentId === p.id) }))}
              userName={userName}
              userEmail={userEmail}
              nonce={nonce}
            />
          </TabsContent>
        )}
        {lead.project && (
          <TabsContent value="progress" className="pt-4">
            <ClientProgressFeed updates={lead.project.updates} />
          </TabsContent>
        )}
        {lead.project && (
          <TabsContent value="timeline" className="pt-4">
            <ClientMilestoneTimeline milestones={lead.project.milestones} />
          </TabsContent>
        )}
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
