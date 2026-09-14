import "server-only";

import type { Order } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { createNotification } from "@/features/notifications/server/creation";

/**
 * The real payment-confirmation path - now called exactly once per order,
 * from handleOrderPaid (src/features/orders/server/post-purchase.ts), which
 * is itself the single idempotent gate every PAID transition routes
 * through. Writes a dashboard Notification and (by default) sends a
 * confirmation email - both non-fatal from the caller's perspective, since a
 * failed notification should never make a successful payment look failed.
 *
 * `sendEmail: false` is passed for a guest-checkout order - guest-fulfillment.ts
 * already sends its own richer welcome/download email (the one that
 * actually contains the auto-login link or file download link), so this
 * would otherwise be a second, strictly-worse "payment received" email for
 * the same purchase. The in-app Notification is still written either way -
 * only the email is guest-specific redundant, not the dashboard record.
 */
export async function notifyOrderPaid(order: Order, options?: { sendEmail?: boolean }): Promise<void> {
  const sendEmail = options?.sendEmail ?? true;
  // Same "should never actually be null by the time an order is PAID" note
  // as createEnrollmentFromOrder - guest-checkout orders get userId
  // backfilled by guest-fulfillment.ts before this is ever called.
  if (!order.userId) return;

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

  if (!user.email || !sendEmail) return;

  const greeting = user.name ? `Hi ${user.name},` : "Hi there,";
  const subject = isPaidPurchase ? `Payment received - ${offering.title}` : `You're confirmed - ${offering.title}`;
  const html = isPaidPurchase
    ? `<p>${greeting}</p><p>Thanks - we've received your payment of <strong>${formatPrice(order.amount, order.currency)}</strong> for <strong>${offering.title}</strong>. Our team will be in touch with next steps shortly.</p><p><a href="${siteConfig.url}${link}">View your order</a></p>`
    : `<p>${greeting}</p><p>You're confirmed for <strong>${offering.title}</strong>. Our team will be in touch with next steps shortly.</p><p><a href="${siteConfig.url}${link}">View your order</a></p>`;

  await resend.emails.send({ from: EMAIL_FROM, to: user.email, subject, html });
}
