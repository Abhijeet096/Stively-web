import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * The one place commission is ever calculated - triggered exclusively by
 * markPaymentPaid (payment-actions.ts), never by anything touching a
 * lead's estimatedValue or a project's quoted totalValue. Formula:
 * commission = payment amount × the salesperson's current
 * SalesProfile.commissionPercentage, snapshotted onto the SalesCommission
 * row so a later rate change never rewrites history. Never hand-created;
 * SalesProjectPayment.salesProjectPaymentId is unique on SalesCommission,
 * so at most one commission can ever exist per payment.
 */
export async function generateCommissionForPayment(paymentId: string): Promise<void> {
  const payment = await prisma.salesProjectPayment.findUnique({
    where: { id: paymentId },
    include: {
      salesProject: {
        include: { salesPerson: { include: { salesProfile: true } } },
      },
    },
  });
  if (!payment || payment.status !== "PAID") return;

  const existing = await prisma.salesCommission.findUnique({ where: { salesProjectPaymentId: paymentId } });
  if (existing) return;

  const salesPerson = payment.salesProject.salesPerson;
  if (!salesPerson?.salesProfile) {
    console.warn(`generateCommissionForPayment: no SalesProfile for project ${payment.salesProjectId} - skipping commission.`);
    return;
  }

  const commissionAmount = Math.round((payment.amount * salesPerson.salesProfile.commissionPercentage) / 100);

  await prisma.$transaction([
    prisma.salesCommission.create({
      data: {
        salesPersonId: salesPerson.id,
        salesProjectId: payment.salesProjectId,
        salesProjectPaymentId: payment.id,
        paymentAmount: payment.amount,
        commissionPercentage: salesPerson.salesProfile.commissionPercentage,
        commissionAmount,
      },
    }),
    prisma.salesLeadActivity.create({
      data: { salesLeadId: payment.salesProject.salesLeadId, type: "PAYMENT_RECEIVED", description: `Payment of ${payment.amount} paise recorded` },
    }),
    prisma.salesLeadActivity.create({
      data: { salesLeadId: payment.salesProject.salesLeadId, type: "COMMISSION_GENERATED", description: `${commissionAmount} paise at ${salesPerson.salesProfile.commissionPercentage}%` },
    }),
  ]);
}
