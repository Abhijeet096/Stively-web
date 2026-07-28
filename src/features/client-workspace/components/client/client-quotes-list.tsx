"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import type { SalesQuote, TeamMember, Offering } from "@prisma/client";

import { respondToQuote } from "../../actions/quote-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { formatPrice } from "@/lib/utils";
import { SALES_QUOTE_STATUS_LABEL, SALES_QUOTE_STATUS_VARIANT } from "@/features/sales-crm/lib/labels";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

type Quote = SalesQuote & { offering: Pick<Offering, "title"> | null; createdBy: Pick<TeamMember, "name"> | null };

function QuoteResponseButtons({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [error, setError] = React.useState<string | undefined>();

  async function respond(status: "ACCEPTED" | "REJECTED") {
    setIsPending(status);
    setError(undefined);
    const result = await respondToQuote({ quoteId, status });
    setIsPending(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Button size="sm" loading={isPending === "ACCEPTED"} disabled={!!isPending} onClick={() => respond("ACCEPTED")}>
          Accept
        </Button>
        <Button size="sm" variant="outline" loading={isPending === "REJECTED"} disabled={!!isPending} onClick={() => respond("REJECTED")}>
          Decline
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

/** Read history + self-serve Accept/Decline - no more relying on email alone to know where a negotiation stands. */
function ClientQuotesList({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No quotes yet"
        description="Once your Stively contact sends a quote, it'll show up here - no need to check email."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {quotes.map((quote) => (
        <li key={quote.id}>
          <Card>
            <CardContent className="flex flex-col gap-2 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground text-sm font-medium">{quote.offering?.title ?? quote.title}</span>
                <Badge variant={SALES_QUOTE_STATUS_VARIANT[quote.status]}>{SALES_QUOTE_STATUS_LABEL[quote.status]}</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                {quote.standardAmount != null && quote.standardAmount > quote.quotedAmount && (
                  <span className="text-muted-foreground text-sm line-through">{formatPrice(quote.standardAmount, quote.currency)}</span>
                )}
                <span className="text-foreground text-lg font-semibold">{formatPrice(quote.quotedAmount, quote.currency)}</span>
              </div>
              {quote.message && <p className="text-muted-foreground text-sm">{quote.message}</p>}
              <span className="text-muted-foreground text-xs">
                {quote.createdBy?.name ?? "Stively"} · {formatDateTime(quote.sentAt)}
              </span>
              {quote.status === "SENT" && <QuoteResponseButtons quoteId={quote.id} />}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export { ClientQuotesList };
