"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { proposeCustomQuote } from "../actions/client-quote-actions";
import { PayApprovedQuoteButton } from "./pay-approved-quote-button";
import type { OfferingRequestWithDetail } from "../server/queries";

export interface QuoteNegotiationPanelProps {
  request: OfferingRequestWithDetail;
  userName?: string;
  userEmail?: string;
  detailPathPrefix: string;
  nonce?: string;
}

function ProposeForm({
  requestId,
  currency,
  rejectionReason,
}: {
  requestId: string;
  currency: string;
  rejectionReason?: string | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const result = await proposeCustomQuote({
      requestId,
      proposedAmount: Math.round(Number(amount) * 100),
      proposedMessage: message || undefined,
    });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setAmount("");
    setMessage("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {rejectionReason !== undefined && (
        <div className="border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-lg border p-3">
          <XCircle className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-medium">Your last proposal wasn&apos;t approved</span>
            {rejectionReason && <span className="text-muted-foreground text-sm">{rejectionReason}</span>}
            <span className="text-muted-foreground text-sm">Feel free to propose a different price below.</span>
          </div>
        </div>
      )}

      <p className="text-muted-foreground text-sm">
        Have a budget in mind? Propose your price and our team will review it - if approved, you can pay right here to get started.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="propose-amount">Your proposed price ({currency})</Label>
          <Input id="propose-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="20000" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="propose-message">Message (optional)</Label>
        <Textarea
          id="propose-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Tell us a bit about your budget or timeline..."
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        size="sm"
        loading={isPending}
        disabled={!amount || Number(amount) <= 0}
        onClick={handleSubmit}
        className="self-end"
      >
        Send proposal
      </Button>
    </div>
  );
}

/**
 * The client half of the "client proposes a price, admin approves, client
 * pays" flow - covers every state a request's negotiation can be in. Reads
 * payment state from `request.order` directly (not `request.status`), so
 * this panel never conflicts with the admin's separate approveRequest
 * pipeline - see admin-quote-actions.ts's comment on why the two stay
 * independent.
 */
function QuoteNegotiationPanel({ request, userName, userEmail, detailPathPrefix, nonce }: QuoteNegotiationPanelProps) {
  const currency = request.offering.currency;

  if (request.order?.status === "PAID") {
    return (
      <Card>
        <CardContent className="flex items-start gap-3">
          <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <span className="text-foreground text-sm font-medium">Paid {formatPrice(request.order.amount, request.order.currency)}</span>
            <span className="text-muted-foreground text-sm">Your project is confirmed and ready to start.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (request.quoteStatus === "APPROVED" && request.approvedAmount != null) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="text-foreground text-sm font-medium">Your quote was approved</span>
              <span className="text-muted-foreground text-sm">Pay now to get your project started.</span>
            </div>
          </div>
          <div className="border-border flex items-baseline gap-2 border-t pt-4">
            <span className="text-foreground font-display text-2xl font-semibold tabular-nums">
              {formatPrice(request.approvedAmount, currency)}
            </span>
          </div>
          <PayApprovedQuoteButton
            requestId={request.id}
            offeringTitle={request.offering.title}
            priceLabel={formatPrice(request.approvedAmount, currency)}
            userName={userName}
            userEmail={userEmail}
            detailPathPrefix={detailPathPrefix}
            nonce={nonce}
          />
        </CardContent>
      </Card>
    );
  }

  if (request.quoteStatus === "PENDING" && request.proposedAmount != null) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-foreground font-display text-xl font-semibold tabular-nums">
              {formatPrice(request.proposedAmount, currency)}
            </span>
            <Badge variant="warning">
              <Clock className="size-3.5" aria-hidden="true" />
              Awaiting review
            </Badge>
          </div>
          {request.proposedMessage && <p className="text-muted-foreground text-sm">{request.proposedMessage}</p>}
          <p className="text-muted-foreground text-sm">We&apos;ll review your proposal and get back to you soon.</p>
        </CardContent>
      </Card>
    );
  }

  if (request.status === "CANCELLED" || request.status === "COMPLETED") {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <ProposeForm
          requestId={request.id}
          currency={currency}
          rejectionReason={request.quoteStatus === "REJECTED" ? request.quoteRejectionReason : undefined}
        />
      </CardContent>
    </Card>
  );
}

export { QuoteNegotiationPanel };
