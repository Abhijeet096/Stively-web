"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createRazorpayOrder, verifyRazorpaySignature } from "@/lib/razorpay";
import type { ActionResult } from "@/actions/leads";
import { generateCommissionForPayment } from "@/features/sales-crm/server/commission-engine";
import { logSalesLeadActivity } from "@/features/sales-crm/server/creation";
import { createNotification } from "@/features/notifications/server/creation";

async function loadOwnedPayment(paymentId: string, clientUserId: string) {
  const payment = await prisma.salesProjectPayment.findUnique({
    where: { id: paymentId },
    include: { salesProject: { include: { salesLead: true, salesPerson: true, projectManager: true } } },
  });
  if (!payment) return null;
  if (payment.salesProject.salesLead.clientUserId !== clientUserId) return null;
  return payment;
}

export type CreateProjectPaymentOrderResult =
  | { success: true; alreadyPaid: true }
  | { success: true; alreadyPaid: false; razorpayOrderId: string; amount: number; keyId: string }
  | { success: false; error: string };

/**
 * Client-facing "Pay Now" - mirrors createOrder's Razorpay-order-creation
 * half (src/features/orders/actions/order-actions.ts) but targets a real
 * SalesProjectPayment installment instead of a catalog Offering. Reuses the
 * same Razorpay order every time it's re-clicked while still PENDING,
 * exactly like createOrderFromApprovedQuote does for a resumed quote.
 */
export async function createProjectPaymentOrder(paymentId: string): Promise<CreateProjectPaymentOrderResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in." };

  const payment = await loadOwnedPayment(paymentId, session.user.id);
  if (!payment) return { success: false, error: "Payment not found." };
  if (payment.status === "PAID") return { success: true, alreadyPaid: true };

  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
    return { success: false, error: "Payments aren't set up yet - please contact us directly." };
  }

  if (payment.razorpayOrderId) {
    return { success: true, alreadyPaid: false, razorpayOrderId: payment.razorpayOrderId, amount: payment.amount, keyId };
  }

  try {
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: payment.amount,
      receipt: `prj_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`,
      notes: { salesProjectPaymentId: payment.id, salesProjectId: payment.salesProjectId },
    });

    await prisma.salesProjectPayment.update({ where: { id: payment.id }, data: { razorpayOrderId: razorpayOrder.id } });

    return { success: true, alreadyPaid: false, razorpayOrderId: razorpayOrder.id, amount: payment.amount, keyId };
  } catch (error) {
    console.error("createProjectPaymentOrder failed:", error);
    return { success: false, error: "Payments aren't set up yet - please contact us directly." };
  }
}

/**
 * Verifies the Razorpay signature and marks the installment PAID - the
 * client-initiated counterpart to markPaymentPaid
 * (src/features/sales-crm/actions/payment-actions.ts's admin manual-record
 * path). Calls the SAME generateCommissionForPayment() so commissions fire
 * identically regardless of which path paid the installment.
 */
export async function verifyProjectPayment(
  paymentId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in." };

  const payment = await loadOwnedPayment(paymentId, session.user.id);
  if (!payment) return { success: false, error: "Payment not found." };
  if (payment.status === "PAID") return { success: false, error: "This payment has already been processed." };
  if (!payment.razorpayOrderId) return { success: false, error: "This payment can't be verified." };

  const isValid = verifyRazorpaySignature({
    orderId: payment.razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!isValid) {
    // Same discipline as Order's verifyPayment - never mark FAILED on a bad
    // signature alone, only a genuine Razorpay payment.failed event should.
    return { success: false, error: "Payment verification failed." };
  }

  try {
    await prisma.salesProjectPayment.update({
      where: { id: paymentId },
      data: { status: "PAID", razorpayPaymentId, razorpaySignature, paidAt: new Date(), method: "Razorpay" },
    });

    await generateCommissionForPayment(paymentId);

    const leadId = payment.salesProject.salesLead.id;
    await logSalesLeadActivity({ salesLeadId: leadId, type: "PAYMENT_RECEIVED", description: payment.label ?? "Project payment" });

    const notifyRecipients = [payment.salesProject.salesPerson?.userId, payment.salesProject.projectManager?.userId].filter(
      (id): id is string => !!id
    );
    await Promise.allSettled(
      notifyRecipients.map((userId) =>
        createNotification({
          userId,
          type: "PAYMENT_RECEIVED",
          title: "Payment received",
          body: `${payment.salesProject.clientName} paid ${payment.label ?? "an installment"}.`,
          link: `/admin/sales-crm/projects/${payment.salesProjectId}`,
        })
      )
    );

    revalidatePath(`/client/projects/${leadId}`);
    revalidatePath("/client/invoices");
    revalidatePath(`/admin/sales-crm/projects/${payment.salesProjectId}`);
    revalidatePath(`/sales/projects/${payment.salesProjectId}`);
    revalidatePath("/admin/sales-crm/commission");
    revalidatePath("/sales/commission");
    return { success: true };
  } catch (error) {
    console.error("verifyProjectPayment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Same non-fatal "nothing to do if already resolved" shape as markOrderFailed. */
export async function markProjectPaymentFailed(paymentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in." };

  const payment = await loadOwnedPayment(paymentId, session.user.id);
  if (!payment || payment.status === "PAID") return { success: true };

  // Deliberately does not change `status` - PENDING/DUE stays as-is so the
  // client can simply retry; only a verified Razorpay event should ever
  // move a SalesProjectPayment to a terminal failed-like state, and this
  // model (unlike Order) has none - it just remains payable.
  return { success: true };
}
