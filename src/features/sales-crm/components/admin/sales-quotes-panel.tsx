"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Send, Mail, MailWarning } from "lucide-react";

import { createAndSendQuote, markQuoteResponse } from "../../actions/quote-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/sections/empty-state";
import { formatPrice } from "@/lib/utils";
import { SALES_QUOTE_STATUS_LABEL, SALES_QUOTE_STATUS_VARIANT } from "../../lib/labels";
import type { getQuotesForLead, OfferingForQuote } from "../../server/queries";

type Quote = Awaited<ReturnType<typeof getQuotesForLead>>[number];

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function QuoteResponseButtons({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState<"ACCEPTED" | "REJECTED" | null>(null);

  async function respond(status: "ACCEPTED" | "REJECTED") {
    setIsPending(status);
    await markQuoteResponse({ quoteId, status });
    setIsPending(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" loading={isPending === "ACCEPTED"} onClick={() => respond("ACCEPTED")}>
        Client accepted
      </Button>
      <Button size="sm" variant="ghost" loading={isPending === "REJECTED"} onClick={() => respond("REJECTED")}>
        Client declined
      </Button>
    </div>
  );
}

export interface SalesQuotesPanelProps {
  salesLeadId: string;
  leadEmail: string | null;
  quotes: Quote[];
  offerings: OfferingForQuote[];
}

/**
 * Lets a salesperson negotiate: pick a real catalog offering (or write a
 * custom title) and send a genuinely custom price - the standard price
 * shown here is just a reference point, never a floor or ceiling. Sending
 * emails the client directly (via Resend) so this is a real quote, not a
 * CRM note that pretends to be one.
 */
function SalesQuotesPanel({ salesLeadId, leadEmail, quotes, offerings }: SalesQuotesPanelProps) {
  const router = useRouter();
  const [offeringId, setOfferingId] = React.useState<string>("custom");
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [lastResult, setLastResult] = React.useState<{ emailSent: boolean } | undefined>();

  const selectedOffering = offerings.find((o) => o.id === offeringId);

  function handleOfferingChange(value: string) {
    setOfferingId(value);
    const offering = offerings.find((o) => o.id === value);
    if (offering) {
      setTitle(offering.title);
      if (offering.price != null) setAmount(String(offering.price / 100));
    }
  }

  async function handleSend() {
    setIsPending(true);
    setError(undefined);
    setLastResult(undefined);
    const result = await createAndSendQuote({
      salesLeadId,
      offeringId: offeringId === "custom" ? undefined : offeringId,
      title,
      quotedAmount: Math.round(Number(amount) * 100),
      message: message || undefined,
    });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setLastResult({ emailSent: !!result.emailSent });
    setTitle("");
    setAmount("");
    setMessage("");
    setOfferingId("custom");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!leadEmail && (
          <p className="text-warning flex items-center gap-2 text-xs">
            <MailWarning className="size-3.5 shrink-0" aria-hidden="true" />
            This lead has no email on file - a quote will be recorded but not emailed.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quote-offering">Based on</Label>
            <Select value={offeringId} onValueChange={handleOfferingChange}>
              <SelectTrigger id="quote-offering">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom (no catalog service)</SelectItem>
                {offerings.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.title}
                    {o.price != null ? ` - ${formatPrice(o.price, o.currency)}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOffering?.price != null && (
              <p className="text-muted-foreground text-xs">Standard price: {formatPrice(selectedOffering.price, selectedOffering.currency)}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quote-title">Quote title</Label>
            <Input id="quote-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Business Website Development" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quote-amount">Quoted price (₹)</Label>
            <Input id="quote-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quote-message">Message to client (optional)</Label>
          <Textarea id="quote-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Thanks for the great conversation today..." />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
        {lastResult && (
          <p className="text-success flex items-center gap-2 text-xs">
            <Mail className="size-3.5" aria-hidden="true" />
            {lastResult.emailSent ? "Quote sent to the client's email." : "Quote recorded (no email sent - no address on file)."}
          </p>
        )}

        <Button size="sm" loading={isPending} disabled={!title || !amount || Number(amount) <= 0} onClick={handleSend} className="self-end">
          <Send className="size-4" aria-hidden="true" />
          Send quote
        </Button>

        {quotes.length === 0 ? (
          <EmptyState icon={FileText} title="No quotes sent yet" description="Send the first one above once you've discussed pricing." />
        ) : (
          <ul className="border-border flex flex-col gap-3 border-t pt-4">
            {quotes.map((quote) => (
              <li key={quote.id} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-foreground text-sm font-medium">{quote.title}</span>
                  <Badge variant={SALES_QUOTE_STATUS_VARIANT[quote.status]}>{SALES_QUOTE_STATUS_LABEL[quote.status]}</Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  {quote.standardAmount != null && quote.standardAmount > quote.quotedAmount && (
                    <span className="text-muted-foreground text-xs line-through">{formatPrice(quote.standardAmount, quote.currency)}</span>
                  )}
                  <span className="text-foreground text-sm font-semibold">{formatPrice(quote.quotedAmount, quote.currency)}</span>
                </div>
                {quote.message && <p className="text-muted-foreground text-sm">{quote.message}</p>}
                <span className="text-muted-foreground text-xs">
                  Sent by {quote.createdBy?.name ?? "Unknown"} · {formatDateTime(quote.sentAt)}
                </span>
                {quote.status === "SENT" && <QuoteResponseButtons quoteId={quote.id} />}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesQuotesPanel };
