import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";
import { resolveProposalToken, recordProposalView } from "@/features/proposals/server/token-queries";
import { notifySalespersonOnProposalEvent } from "@/features/proposals/actions/proposal-actions";
import { logSalesLeadActivity } from "@/features/sales-crm/server/creation";
import {
  ProposalCover,
  ProposalBusinessAudit,
  ProposalNarrative,
  ProposalProblems,
  ProposalBeforeAfter,
  ProposalSolution,
  ProposalEstimatedImpact,
  ProposalTimeline,
  ProposalDeliverables,
  ProposalPricing,
  ProposalRoi,
  ProposalWhyStively,
  ProposalFaq,
} from "@/features/proposals/components/public/proposal-sections";
import { ProposalCalculator } from "@/features/proposals/components/public/proposal-calculator";
import { ProposalResponsePanel } from "@/features/proposals/components/public/proposal-response-panel";
import { ProposalAiChat } from "@/features/proposals/components/public/proposal-ai-chat";
import { ProposalAnalyticsBeacon } from "@/features/proposals/components/public/proposal-analytics-beacon";
import type { ProposalContent } from "@/features/proposals/lib/content-types";

interface ProposalTokenPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Your Proposal",
  robots: { index: false, follow: false },
};

function StatusScreen({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="bg-muted flex size-14 items-center justify-center rounded-full">
        <AlertTriangle className="text-muted-foreground size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        <p className="text-muted-foreground max-w-sm text-sm text-pretty">{description}</p>
      </div>
    </div>
  );
}

/**
 * No auth, no dashboard shell - a proposal recipient is never expected to
 * have a Stively account (see Proposal.token's schema comment, identical
 * reasoning to InterviewLink). Every failure mode gets its own honest
 * message instead of a generic 404.
 */
export default async function ProposalTokenPage({ params }: ProposalTokenPageProps) {
  const { token } = await params;
  const resolution = await resolveProposalToken(token);

  if (resolution.status === "not_found") {
    return <StatusScreen title="This link isn't valid" description="Double-check the link you were sent, or reach out to your Stively contact for a new one." />;
  }

  if (resolution.status === "expired") {
    return <StatusScreen title="This proposal link has expired" description="Reach out to your Stively contact and we'll send you a fresh one." />;
  }

  const { proposal } = resolution;
  const currentVersion = proposal.versions[0];

  if (!currentVersion) {
    return <StatusScreen title="This proposal isn't ready yet" description="Check back shortly, or reach out to your Stively contact." />;
  }

  const { isFirstView } = await recordProposalView(proposal.id);
  if (isFirstView) {
    await logSalesLeadActivity({ salesLeadId: proposal.salesLeadId, type: "PROPOSAL_VIEWED", description: proposal.title, performedById: null });
    await notifySalespersonOnProposalEvent({
      salesLeadId: proposal.salesLeadId,
      proposalId: proposal.id,
      type: "PROPOSAL_VIEWED",
      title: "Proposal viewed",
      body: `${proposal.salesLead.businessName} opened "${proposal.title}".`,
    });
  }

  const content = currentVersion.content as unknown as ProposalContent;

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border border-b py-4">
        <Container size="narrow">
          <Logo />
        </Container>
      </header>

      <Container size="narrow" className="flex flex-col gap-14 py-10 sm:py-14">
        <ProposalCover lead={proposal.salesLead} content={content} sequence={proposal.sequence} preparedOn={proposal.sentAt ?? proposal.createdAt} />
        <ProposalBusinessAudit content={content} />
        <ProposalNarrative content={content} />
        <ProposalProblems content={content} />
        <ProposalBeforeAfter content={content} />
        <ProposalSolution content={content} />
        <ProposalEstimatedImpact content={content} />
        <div data-proposal-section="timeline">
          <ProposalTimeline content={content} />
        </div>
        <ProposalDeliverables content={content} />
        <div data-proposal-section="pricing" className="flex flex-col gap-14">
          <ProposalPricing content={content} />
          <ProposalCalculator calculator={content.calculator} />
        </div>
        <ProposalRoi content={content} />
        <ProposalWhyStively content={content} />
        <ProposalFaq content={content} />
        <ProposalResponsePanel
          token={token}
          status={proposal.status}
          packages={content.packages}
          calculator={content.calculator}
          comments={proposal.comments.filter((c) => c.type !== "AI_CHAT")}
          meetingRequests={proposal.meetingRequests}
        />
      </Container>

      <ProposalAiChat
        token={token}
        initialExchanges={proposal.comments
          .filter((c) => c.type === "AI_CHAT" && c.aiAnswer)
          .map((c) => ({ id: c.id, question: c.content, answer: c.aiAnswer as string }))}
      />
      <ProposalAnalyticsBeacon token={token} />
    </div>
  );
}
