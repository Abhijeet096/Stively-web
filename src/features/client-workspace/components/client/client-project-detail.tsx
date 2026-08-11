import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { SalesProjectPayment, ClientDocument, ProjectUpdate, ProjectMilestone, OnboardingForm } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SALES_PROJECT_STATUS_LABEL, SALES_PROJECT_STATUS_VARIANT } from "@/features/sales-crm/lib/labels";
import { ClientOnboardingForms } from "@/features/onboarding-forms/components/client/client-onboarding-forms";
import { ClientPaymentsList } from "./client-payments-list";
import { ClientProgressFeed } from "./client-progress-feed";
import { ClientMilestoneTimeline } from "./client-milestone-timeline";

export interface ClientProjectDetailProps {
  leadId: string;
  businessName: string;
  project: {
    id: string;
    name: string;
    status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
    progressPercent: number;
    payments: (SalesProjectPayment & { documents: ClientDocument[] })[];
    updates: ProjectUpdate[];
    milestones: ProjectMilestone[];
  };
  onboardingForms: OnboardingForm[];
  userName?: string;
  userEmail?: string;
  nonce?: string;
}

/** One project's own Payments/Progress/Timeline/Onboarding - split out from ClientWorkspaceDetail so a client with several projects never sees them flattened together. */
function ClientProjectDetail({ leadId, businessName, project, onboardingForms, userName, userEmail, nonce }: ClientProjectDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Link href={`/client/projects/${leadId}`} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {businessName}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">{project.name}</h1>
          <Badge variant={SALES_PROJECT_STATUS_VARIANT[project.status]}>{SALES_PROJECT_STATUS_LABEL[project.status]}</Badge>
          <span className="text-muted-foreground text-sm">{project.progressPercent}% complete</span>
        </div>
      </div>

      <Tabs defaultValue="progress">
        <TabsList>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>
        <TabsContent value="progress" className="pt-4">
          <ClientProgressFeed updates={project.updates} />
        </TabsContent>
        <TabsContent value="timeline" className="pt-4">
          <ClientMilestoneTimeline milestones={project.milestones} />
        </TabsContent>
        <TabsContent value="payments" className="pt-4">
          <ClientPaymentsList payments={project.payments} userName={userName} userEmail={userEmail} nonce={nonce} />
        </TabsContent>
        <TabsContent value="onboarding" className="pt-4">
          <ClientOnboardingForms forms={onboardingForms} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { ClientProjectDetail };
