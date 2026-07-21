import "server-only";

import type { Order } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { createNotification } from "@/features/notifications/server/creation";

/**
 * The real payment-confirmation path createOrder/verifyPayment/the webhook
 * all call once an Order genuinely transitions to PAID (each call site is
 * already guarded so this only ever fires once per order - see the
 * `status: "PENDING"` checks at each of them). Writes a dashboard
 * Notification and sends a confirmation email - both non-fatal from the
 * caller's perspective (wrapped in try/catch at each call site), since a
 * failed notification should never make a successful payment look failed.
 */
export async function notifyOrderPaid(order: Order): Promise<void> {
  const [user, offering] = await Promise.all([
    prisma.user.findUnique({
      where: { id: order.userId },
      select: { email: true, name: true, role: true },
    }),
    prisma.offering.findUnique({ where: { id: order.offeringId }, select: { title: true } }),
  ]);
  if (!user || !offering) return;

  const ordersPath = user.role === "CLIENT" ? "/client/orders" : "/student/orders";
  const link = `${ordersPath}/${order.id}`;
  const isPaidPurchase = order.amount > 0;

  await createNotification({
    userId: order.userId,
    type: "PAYMENT_RECEIVED",
    title: isPaidPurchase ? "Payment received" : "You're confirmed",
    body: isPaidPurchase
      ? `We've received your payment of ${formatPrice(order.amount, order.currency)} for ${offering.title}.`
      : `You're confirmed for ${offering.title}.`,
    link,
  });

  if (!user.email) return;

  const greeting = user.name ? `Hi ${user.name},` : "Hi there,";
  const subject = isPaidPurchase ? `Payment received - ${offering.title}` : `You're confirmed - ${offering.title}`;
  const html = isPaidPurchase
    ? `<p>${greeting}</p><p>Thanks - we've received your payment of <strong>${formatPrice(order.amount, order.currency)}</strong> for <strong>${offering.title}</strong>. Our team will be in touch with next steps shortly.</p><p><a href="${siteConfig.url}${link}">View your order</a></p>`
    : `<p>${greeting}</p><p>You're confirmed for <strong>${offering.title}</strong>. Our team will be in touch with next steps shortly.</p><p><a href="${siteConfig.url}${link}">View your order</a></p>`;

  await resend.emails.send({ from: EMAIL_FROM, to: user.email, subject, html });
}
