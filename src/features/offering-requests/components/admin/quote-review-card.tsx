"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle2, XCircle } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { formatPrice } from "@/lib/utils";
import { approveCustomQuote, rejectCustomQuote } from "@/features/offering-requests/actions/admin-quote-actions";
import type { RequestQuoteStatus, RequestType, Role } from "@prisma/client";

export interface QuoteReviewCardRequest {
  id: string;
  requestType: RequestType;
  user: { role: Role };
  proposedAmount: number | null;
  proposedMessage: string | null;
  quoteStatus: RequestQuoteStatus | null;
  approvedAmount: number | null;
  quoteRejectionReason: string | null;
  quoteReviewedAt: Date | null;
}

const PERCENT_PRESETS = [50, 75, 100] as const;

const STATUS_LABEL: Record<RequestQuoteStatus, string> = {
  PENDING: "Awaiting your review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_VARIANT: Record<RequestQuoteStatus, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/**
 * Admin review surface for a client's proposed price (see proposeCustomQuote
 * in offering-requests/actions/client-quote-actions.ts). Only rendered for
 * REQUEST-type Operations items - an Order never carries a negotiated price,
 * it's a fixed-price purchase by definition.
 */
function QuoteReviewCard({ request }: { request: QuoteReviewCardRequest }) {
  const router = useRouter();
  const isClient = request.user.role === "CLIENT";
  const [approvedAmount, setApprovedAmount] = React.useState(
    request.proposedAmount != null ? String(request.proposedAmount / 100) : ""
  );
  const [phone, setPhone] = React.useState("");
  const [paymentPercent, setPaymentPercent] = React.useState<number>(50);
  const [rejectReason, setRejectReason] = React.useState("");
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleApprove() {
    setIsApproving(true);
    setError(undefined);
    const result = await approveCustomQuote({
      requestId: request.id,
      approvedAmount: Math.round(Number(approvedAmount) * 100),
      ...(isClient ? { phone: phone.trim(), paymentPercent } : {}),
    });
    setIsApproving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleReject() {
    setIsRejecting(true);
    setError(undefined);
    const result = await rejectCustomQuote({ requestId: request.id, reason: rejectReason || undefined });
    setIsRejecting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setRejectReason("");
    router.refresh();
  }

  if (!request.quoteStatus || request.proposedAmount == null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom quote</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={FileText} title="No proposal yet" description="The client hasn't proposed a custom price for this request." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom quote</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-foreground font-display text-xl font-semibold tabular-nums">{formatPrice(request.proposedAmount)}</span>
          <Badge variant={STATUS_VARIANT[request.quoteStatus]}>{STATUS_LABEL[request.quoteStatus]}</Badge>
        </div>
        {request.proposedMessage && <p className="text-muted-foreground text-sm">{request.proposedMessage}</p>}

        {request.quoteStatus === "APPROVED" && (
          <div className="border-border flex flex-col gap-1 border-t pt-3">
            <span className="text-foreground text-sm font-medium">Approved at {formatPrice(request.approvedAmount ?? request.proposedAmount)}</span>
            {request.quoteReviewedAt && (
              <span className="text-muted-foreground text-xs">Reviewed {formatDateTime(request.quoteReviewedAt)}</span>
            )}
            {isClient && <span className="text-muted-foreground text-xs">Moved to the Sales CRM - see the client&apos;s project workspace for payments, chat, and progress.</span>}
          </div>
        )}

        {request.quoteStatus === "REJECTED" && (
          <div className="border-border flex flex-col gap-1 border-t pt-3">
            {request.quoteRejectionReason && <span className="text-muted-foreground text-sm">Reason: {request.quoteRejectionReason}</span>}
            <span className="text-muted-foreground text-xs">The client can propose again from their side.</span>
          </div>
        )}

        {request.quoteStatus === "PENDING" && (
          <div className="border-border flex flex-col gap-4 border-t pt-4">
            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-approve-amount">Approve at (₹)</Label>
              <Input
                id="quote-approve-amount"
                type="number"
                min={1}
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
              />
            </div>

            {isClient && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="quote-approve-phone">Client&apos;s phone number</Label>
                  <Input
                    id="quote-approve-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Never collected by the self-service wizard - needed to open their Sales CRM record"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Collect now</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PERCENT_PRESETS.map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        size="sm"
                        variant={paymentPercent === preset ? "primary" : "outline"}
                        onClick={() => setPaymentPercent(preset)}
                      >
                        {preset}%
                      </Button>
                    ))}
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={paymentPercent}
                      onChange={(e) => setPaymentPercent(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                      className="w-20"
                    />
                  </div>
                  {approvedAmount && Number(approvedAmount) > 0 && (
                    <p className="text-muted-foreground text-xs">
                      First installment: {formatPrice(Math.round(Number(approvedAmount) * paymentPercent))}
                    </p>
                  )}
                </div>
              </>
            )}

            <Button
              size="sm"
              loading={isApproving}
              disabled={!approvedAmount || Number(approvedAmount) <= 0 || (isClient && !phone.trim())}
              onClick={handleApprove}
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {isClient ? "Approve & start project" : "Approve"}
            </Button>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-reject-reason">Rejection reason (optional)</Label>
              <Textarea
                id="quote-reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="Let the client know why, if helpful..."
              />
            </div>
            <Button size="sm" variant="outline" loading={isRejecting} onClick={handleReject}>
              <XCircle className="size-4" aria-hidden="true" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { QuoteReviewCard };
