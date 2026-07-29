"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone, Building2, CheckCircle2 } from "lucide-react";

import { claimLead } from "@/features/leads/actions/claim-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LeadWithOwner } from "@/lib/queries/leads";

const SOURCE_LABEL: Record<string, string> = {
  CONTACT_FORM: "Contact Form",
  PROGRAM_INTEREST: "Program Interest",
  CAREERS: "Careers",
  NEWSLETTER_POPUP: "Newsletter",
  CLIENT_PORTAL: "Client Portal",
  START_PROJECT: "Start Project (Ads)",
  OTHER: "Other",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** One card, two modes: `claimable` renders the Claim button (unclaimed section); otherwise a read-only "yours" card (my-claimed section). */
function InboundLeadCard({ lead, claimable }: { lead: LeadWithOwner; claimable: boolean }) {
  const router = useRouter();
  const [isClaiming, setIsClaiming] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function handleClaim() {
    setIsClaiming(true);
    setError(undefined);
    const result = await claimLead(lead.id);
    if (!result.success) {
      setError(result.error);
      setIsClaiming(false);
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground font-display text-base font-semibold">{lead.name}</span>
            {lead.companyName && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Building2 className="size-3" aria-hidden="true" />
                {lead.companyName}
              </span>
            )}
          </div>
          <Badge variant="outline">{SOURCE_LABEL[lead.source] ?? lead.source}</Badge>
        </div>

        {lead.phone && (
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Phone className="size-3.5" aria-hidden="true" />
            {lead.phone}
          </span>
        )}

        {lead.message && <p className="text-muted-foreground line-clamp-2 text-sm">{lead.message}</p>}

        <span className="text-muted-foreground text-xs">{formatDateTime(lead.createdAt)}</span>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        {claimable ? (
          <Button size="sm" loading={isClaiming} onClick={handleClaim} className="w-fit">
            Claim this lead
          </Button>
        ) : (
          <span className="text-primary flex w-fit items-center gap-1.5 text-sm font-medium">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Claimed by you
          </span>
        )}
      </CardContent>
    </Card>
  );
}

export { InboundLeadCard };
