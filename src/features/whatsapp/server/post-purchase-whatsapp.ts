import "server-only";

import type { Order } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  isWhatsAppSendConfigured,
  sendWhatsAppTemplateMessage,
} from "@/lib/whatsapp-cloud-api";
import {
  ORDER_CONFIRMATION_TEMPLATE_NAME,
  WHATSAPP_TEMPLATE_LANGUAGE,
  isOrderConfirmationTemplateConfigured,
} from "../lib/config";
import { findWhatsAppContactByPhone, upsertWhatsAppContact, markOutboundSent, logWhatsAppMessage, normalizePhoneForWhatsApp } from "./contact";

/**
 * Called from handleOrderPaid (orders/server/post-purchase.ts) for every
 * PAID order - the immediate post-purchase confirmation. Never throws:
 * every exit is either a silent no-op (not eligible, not configured yet) or
 * a caught-and-logged failure, since a WhatsApp send must never affect
 * payment success (requirement #5).
 *
 * Idempotency is two independent layers: handleOrderPaid's own
 * postPurchaseProcessedAt claim already means this whole function runs at
 * most once per order under normal operation, but Order.whatsappConfirmationSentAt
 * is claimed here too (requirement #6's explicit ask for a DB-enforced,
 * not-just-in-memory guard) so a future direct call to this function -
 * a backfill script, a retry path - can never double-send even if it
 * bypasses handleOrderPaid entirely.
 */
export async function sendPostPurchaseWhatsApp(order: Order): Promise<void> {
  if (!isWhatsAppSendConfigured() || !isOrderConfirmationTemplateConfigured()) {
    // Meta credentials/template genuinely don't exist yet in this
    // environment - stay silent rather than log noise on every single
    // order, per requirement #9's "do not make the system appear live when
    // Meta configuration has not been completed."
    return;
  }
  if (!order.phone) return;

  const phoneNumber = normalizePhoneForWhatsApp(order.phone);
  if (!phoneNumber) return;

  const existingContact = await findWhatsAppContactByPhone(phoneNumber);
  if (existingContact?.optedOutAt) return;

  const claim = await prisma.order.updateMany({
    where: { id: order.id, whatsappConfirmationSentAt: null },
    data: { whatsappConfirmationSentAt: new Date() },
  });
  if (claim.count === 0) return;

  const [offering, buyerName] = await Promise.all([
    prisma.offering.findUnique({ where: { id: order.offeringId }, select: { title: true } }),
    resolveBuyerFirstName(order),
  ]);
  if (!offering) return;

  const result = await sendWhatsAppTemplateMessage({
    to: phoneNumber,
    templateName: ORDER_CONFIRMATION_TEMPLATE_NAME,
    languageCode: WHATSAPP_TEMPLATE_LANGUAGE,
    bodyParams: [buyerName, offering.title],
  });

  if (!result.success || !result.waId) {
    console.error("sendPostPurchaseWhatsApp: send failed:", result.error);
    return;
  }

  const contact = await upsertWhatsAppContact({
    whatsappId: result.waId,
    phoneNumber,
    name: existingContact?.name ?? (buyerName !== "there" ? buyerName : null),
    source: existingContact ? undefined : "POST_PURCHASE",
  });

  await markOutboundSent(contact.id);
  await logWhatsAppMessage({
    whatsappContactId: contact.id,
    direction: "OUTBOUND",
    content: `[template:${ORDER_CONFIRMATION_TEMPLATE_NAME}] order confirmation for ${offering.title}`,
    metaMessageId: result.metaMessageId,
  });
}

async function resolveBuyerFirstName(order: Order): Promise<string> {
  const fullName =
    order.guestName ?? (order.userId ? (await prisma.user.findUnique({ where: { id: order.userId }, select: { name: true } }))?.name : null);
  return fullName?.trim().split(/\s+/)[0] || "there";
}
