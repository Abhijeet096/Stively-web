"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import type { SalesProjectPayment } from "@prisma/client";

import { createProjectPayment, markPaymentPaid } from "../../actions/payment-actions";
import { GenerateInvoiceDialog } from "@/features/documents/components/admin/generate-invoice-dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { formatPrice } from "@/lib/utils";
import { SALES_PROJECT_PAYMENT_STATUS_LABEL, SALES_PROJECT_PAYMENT_STATUS_VARIANT } from "../../lib/labels";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function MarkPaidButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleClick() {
    setIsPending(true);
    setError(undefined);
    const result = await markPaymentPaid({ paymentId });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" loading={isPending} onClick={handleClick}>
        Mark paid
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function SalesProjectPaymentsPanel({
  salesProjectId,
  clientName,
  payments,
}: {
  salesProjectId: string;
  clientName: string;
  payments: SalesProjectPayment[];
}) {
  const router = useRouter();
  const [amount, setAmount] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [method, setMethod] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0);

  async function handleAdd() {
    setIsPending(true);
    setError(undefined);
    const result = await createProjectPayment({
      salesProjectId,
      amount: Math.round(Number(amount) * 100),
      label: label.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      method: method || undefined,
      reference: reference || undefined,
    });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setAmount("");
    setLabel("");
    setDueDate("");
    setMethod("");
    setReference("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Received so far: <span className="text-foreground font-medium">{formatPrice(totalPaid)}</span>
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-amount">Amount (₹)</Label>
            <Input id="pay-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-label">Label (client-facing)</Label>
            <Input id="pay-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Advance Payment (50%)" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-due">Due date</Label>
            <Input id="pay-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-method">Method</Label>
            <Input id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Bank transfer, UPI..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-ref">Reference</Label>
            <Input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction ID, cheque no..." />
          </div>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button size="sm" loading={isPending} disabled={!amount || Number(amount) <= 0} onClick={handleAdd} className="self-end">
          Add payment
        </Button>

        {payments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments recorded" description="Add the first installment above." />
        ) : (
          <ul className="border-border flex flex-col gap-3 border-t pt-4">
            {payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-foreground text-sm font-medium">
                    {payment.label ? `${payment.label} · ` : ""}
                    {formatPrice(payment.amount)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {payment.method || "No method"} {payment.reference ? `· ${payment.reference}` : ""}
                    {payment.dueDate ? ` · Due ${formatDate(payment.dueDate)}` : ""}
                    {payment.paidAt ? ` · Paid ${formatDate(payment.paidAt)}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={SALES_PROJECT_PAYMENT_STATUS_VARIANT[payment.status]}>
                    {SALES_PROJECT_PAYMENT_STATUS_LABEL[payment.status]}
                  </Badge>
                  <GenerateInvoiceDialog salesProjectId={salesProjectId} paymentId={payment.id} clientName={clientName} />
                  {payment.status !== "PAID" && <MarkPaidButton paymentId={payment.id} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesProjectPaymentsPanel };
