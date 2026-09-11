import Link from "next/link";
import { Download } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatOrderNumber } from "../lib/order-number";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderMeetings } from "./order-meetings";
import type { OrderWithMeetings } from "../server/queries";

/**
 * Receipt-style confirmation - number, offering, amount, status, paid
 * date, plus any Meetings staff have scheduled about this order (see
 * OrderMeetings - renders nothing when there are none, so an order with
 * no meetings looks exactly as it did before this existed).
 */
function OrderDetailView({ order }: { order: OrderWithMeetings }) {
  const hasDownload =
    order.status === "PAID" && !!order.downloadToken && !!order.downloadTokenExpiresAt && order.downloadTokenExpiresAt > new Date();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground font-mono text-sm">{formatOrderNumber(order.sequence)}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">{order.offering.title}</h2>
      </header>

      <Card className="max-w-md">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Amount</span>
            <span className="text-foreground font-display text-lg font-semibold tabular-nums">
              {order.amount === 0 ? "Free" : formatPrice(order.amount, order.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Order date</span>
            <span className="text-foreground text-sm">
              {order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          {order.paidAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Paid on</span>
              <span className="text-foreground text-sm">
                {order.paidAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          )}
          {order.status === "PAID" && !hasDownload && (
            <p className="text-success text-sm font-medium">
              You&apos;re confirmed for {order.offering.title}. Our team will be in touch with next steps.
            </p>
          )}
          {order.status === "PAID" && hasDownload && (
            <p className="text-success text-sm font-medium">Your payment for {order.offering.title} is confirmed.</p>
          )}
          {order.status === "PENDING" && (
            <p className="text-muted-foreground text-sm">This payment hasn&apos;t completed yet.</p>
          )}
          {order.status === "FAILED" && (
            <p className="text-destructive text-sm">This payment didn&apos;t go through - you can try again.</p>
          )}

          {hasDownload && (
            <div className="border-border/70 flex flex-col gap-2 border-t pt-4">
              <Button asChild className="w-full">
                <a href={`/api/digital-store/download/${order.downloadToken}`} download>
                  <Download aria-hidden="true" />
                  Download your file
                </a>
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                Works until{" "}
                {order.downloadTokenExpiresAt!.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}{" "}
                - come back to this page to re-download any time before then.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderMeetings meetings={order.meetings} />

      <Link href={`/offerings/${order.offering.slug}`} className="text-primary text-sm font-medium underline-offset-4 hover:underline">
        View offering
      </Link>
    </div>
  );
}

export { OrderDetailView };
