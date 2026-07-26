"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ExternalLink } from "lucide-react";
import type { Proposal } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/sections/empty-state";
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_VARIANT } from "../../lib/labels";
import { generateProposal } from "../../actions/proposal-actions";
import type { ProposalReadiness } from "../../lib/readiness";

interface ProposalSummaryPanelProps {
  salesLeadId: string;
  activeProposal: Proposal | null;
  readiness: ProposalReadiness;
  /** Differs between /admin/sales-crm and /sales portal. */
  workspaceBasePath: string;
}

/**
 * The lead detail page's proposal entry point - Generate Proposal (blocked
 * until discovery is complete) or, once one exists, a summary + link into
 * the full workspace (package/pricing/ROI editors, co-pilot, version
 * history, send) at workspaceBasePath/proposal.
 */
function ProposalSummaryPanel({ salesLeadId, activeProposal, readiness, workspaceBasePath }: ProposalSummaryPanelProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleGenerate() {
    setIsGenerating(true);
    setError(undefined);
    const result = await generateProposal({ salesLeadId });
    setIsGenerating(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>AI Proposal</CardTitle>
        {activeProposal && <Badge variant={PROPOSAL_STATUS_VARIANT[activeProposal.status]}>{PROPOSAL_STATUS_LABEL[activeProposal.status]}</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {!activeProposal ? (
          <>
            <EmptyState
              icon={Sparkles}
              title="No proposal yet"
              description="Generate a full AI-personalized proposal - cover, business understanding, solution, timeline, pricing, and more - once discovery is complete."
            />
            {!readiness.ready && (
              <p className="text-muted-foreground text-xs">
                Complete discovery first: {readiness.missing.join(", ")}.
              </p>
            )}
            <Button size="sm" loading={isGenerating} onClick={handleGenerate} disabled={!readiness.ready} className="self-start">
              <Sparkles className="size-4" aria-hidden="true" />
              Generate Proposal
            </Button>
          </>
        ) : (
          <>
            <p className="text-foreground text-sm font-medium">{activeProposal.title}</p>
            <p className="text-muted-foreground text-xs">
              {activeProposal.viewCount} view{activeProposal.viewCount === 1 ? "" : "s"}
              {activeProposal.sentAt ? ` · Sent ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(activeProposal.sentAt)}` : ""}
            </p>
            <Button size="sm" variant="outline" asChild className="self-start">
              <Link href={`${workspaceBasePath}/leads/${salesLeadId}/proposal`}>
                Open workspace
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { ProposalSummaryPanel };
