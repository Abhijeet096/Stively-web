import Link from "next/link";
import type { SalesProjectPayment, ClientDocument } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_VARIANT } from "../../lib/payment-labels";
import { ProjectPaymentButton } from "./project-payment-button";

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export interface ClientPaymentsListProps {
  payments: (SalesProjectPayment & { documents?: ClientDocument[]; salesProject?: { clientName: string; salesLeadId: string } })[];
  userName?: string;
  userEmail?: string;
  nonce?: string;
  /** Shows the business name column - only needed on the flat cross-project /client/invoices list. */
  showBusiness?: boolean;
}

/** Read-only list + inline "Pay Now" for whichever installments are still payable - shared between the per-project Payments tab and the flat /client/invoices page. */
function ClientPaymentsList({ payments, userName, userEmail, nonce, showBusiness }: ClientPaymentsListProps) {
  if (payments.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">No payments yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {payments.map((payment) => {
        // The query already excludes ARCHIVED/superseded versions (see
        // server/queries.ts) - once a Receipt exists it's the more relevant
        // confirmation than the Invoice it settles, so prefer it.
        const invoiceDoc =
          payment.documents?.find((d) => d.type === "RECEIPT") ?? payment.documents?.find((d) => d.type === "INVOICE");
        return (
          <li key={payment.id} className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">{payment.label ?? "Payment"}</span>
                <Badge variant={PAYMENT_STATUS_VARIANT[payment.status]}>{PAYMENT_STATUS_LABEL[payment.status]}</Badge>
              </div>
              {showBusiness && payment.salesProject && (
                <Link href={`/client/projects/${payment.salesProject.salesLeadId}`} className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline">
                  {payment.salesProject.clientName}
                </Link>
              )}
              <span className="text-muted-foreground text-xs">
                {payment.status === "PAID" ? `Paid ${formatDate(payment.paidAt)}` : payment.dueDate ? `Due ${formatDate(payment.dueDate)}` : "No due date set"}
              </span>
              {invoiceDoc && (
                <a href={invoiceDoc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline-offset-2 hover:underline">
                  Download {invoiceDoc.type === "INVOICE" ? "invoice" : "receipt"}
                </a>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-foreground text-lg font-semibold">{formatPrice(payment.amount)}</span>
              {payment.status !== "PAID" && (
                <ProjectPaymentButton paymentId={payment.id} label={payment.label ?? "Project payment"} userName={userName} userEmail={userEmail} nonce={nonce} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export { ClientPaymentsList };
