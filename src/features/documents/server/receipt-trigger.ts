import "server-only";

import { prisma } from "@/lib/prisma";
import { generateDocument } from "./generate";

/**
 * Receipt is never admin-authored - it's always a direct consequence of a
 * payment being marked PAID (see ARCHITECTURE_DECISIONS.md - Receipt has
 * no Draft/review step, generation IS delivery). Called from both places a
 * payment can be marked PAID: sales-crm's markPaymentPaid (admin manual
 * entry) and client-workspace's verifyProjectPayment (client Razorpay
 * checkout) - one shared function so receipt-generation logic exists in
 * exactly one place, not duplicated across both features.
 *
 * Deliberately swallows its own errors at the call site's discretion, not
 * here - a failed PDF render must never be allowed to undo or block a
 * payment that has already, genuinely, been received.
 */
export async function generateReceiptForPayment(paymentId: string) {
  const payment = await prisma.salesProjectPayment.findUnique({
    where: { id: paymentId },
    include: { salesProject: true },
  });
  if (!payment || payment.status !== "PAID") return null;

  const relatedInvoice = await prisma.clientDocument.findFirst({
    where: {
      relatedPaymentId: paymentId,
      templateType: "INVOICE",
      lifecycleStatus: { not: "ARCHIVED" },
    },
    orderBy: { version: "desc" },
  });

  return generateDocument(
    "RECEIPT",
    {
      clientName: payment.salesProject.clientName,
      amount: payment.amount,
      paymentMethod: payment.method ?? "Unknown",
      transactionReference: payment.razorpayPaymentId ?? payment.reference ?? undefined,
      paidAt: payment.paidAt ?? new Date(),
      relatedInvoiceNumber: relatedInvoice?.documentNumber ?? undefined,
    },
    { salesLeadId: payment.salesProject.salesLeadId, relatedPaymentId: paymentId }
  );
}
