import { prisma } from "@/lib/prisma";
import { isValidCronRequest } from "@/features/lead-intelligence/server/cron-auth";
import {
  isWhatsAppSendConfigured,
  sendWhatsAppTemplateMessage,
} from "@/lib/whatsapp-cloud-api";
import {
  CROSS_SELL_TEMPLATE_NAME,
  WHATSAPP_TEMPLATE_LANGUAGE,
  CROSS_SELL_DELAY_DAYS,
  isCrossSellTemplateConfigured,
} from "@/features/whatsapp/lib/config";
import { getRecommendedOfferingSlug } from "@/features/whatsapp/lib/products";
import { findWhatsAppContactByPhone, upsertWhatsAppContact, markOutboundSent, logWhatsAppMessage, normalizePhoneForWhatsApp } from "@/features/whatsapp/server/contact";

const BATCH_SIZE = 50;

/**
 * The delayed half of Phase 1's cross-sell (the immediate confirmation is
 * sendPostPurchaseWhatsApp, called synchronously from handleOrderPaid) -
 * this is deliberately a separate, later-triggered path, not something
 * handleOrderPaid could ever fire itself (a request handler can't wait
 * three days). Reuses the existing Vercel Cron pattern this codebase
 * already has (see lead-intelligence's own cron routes) rather than adding
 * a scheduling framework - per the audit's own "do not create an
 * unnecessary scheduling framework."
 *
 * Each order is claimed atomically (Order.whatsappCrossSellSentAt,
 * updateMany where still null) immediately before its send attempt, so a
 * batch that partially fails and gets retried by a later cron tick can
 * never double-send to an order it already reached - same idiom as every
 * other DB-enforced idempotency claim in this codebase.
 */
export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isWhatsAppSendConfigured() || !isCrossSellTemplateConfigured()) {
    return Response.json({ ok: true, skipped: "WhatsApp not configured", processedCount: 0 });
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - CROSS_SELL_DELAY_DAYS);
  // A narrow same-day window (not "paidAt <= cutoff") so this cron - which
  // may run more than once a day, or be backfilled after downtime - doesn't
  // treat every older paid order as freshly eligible every time it runs.
  const windowStart = new Date(cutoff);
  windowStart.setUTCHours(0, 0, 0, 0);
  const windowEnd = new Date(cutoff);
  windowEnd.setUTCHours(23, 59, 59, 999);

  const eligibleOrders = await prisma.order.findMany({
    where: {
      status: "PAID",
      paidAt: { gte: windowStart, lte: windowEnd },
      whatsappCrossSellSentAt: null,
      phone: { not: null },
    },
    take: BATCH_SIZE,
    include: { offering: { select: { slug: true } } },
  });

  let sentCount = 0;
  let skippedCount = 0;

  for (const order of eligibleOrders) {
    try {
      const recommendedSlug = getRecommendedOfferingSlug(order.offering.slug);
      if (!recommendedSlug) {
        skippedCount++;
        continue;
      }

      const phoneNumber = order.phone ? normalizePhoneForWhatsApp(order.phone) : null;
      if (!phoneNumber) {
        skippedCount++;
        continue;
      }

      const existingContact = await findWhatsAppContactByPhone(phoneNumber);
      if (existingContact?.optedOutAt) {
        skippedCount++;
        continue;
      }

      const claim = await prisma.order.updateMany({
        where: { id: order.id, whatsappCrossSellSentAt: null },
        data: { whatsappCrossSellSentAt: new Date() },
      });
      if (claim.count === 0) continue; // already handled by a concurrent/earlier run

      const recommendedOffering = await prisma.offering.findFirst({
        where: { slug: recommendedSlug, status: "PUBLISHED", visible: true },
        select: { title: true, slug: true },
      });
      if (!recommendedOffering) {
        skippedCount++;
        continue;
      }

      const buyerName = (order.guestName ?? "there").trim().split(/\s+/)[0] || "there";
      const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/digital-store/${recommendedOffering.slug}`;

      const result = await sendWhatsAppTemplateMessage({
        to: phoneNumber,
        templateName: CROSS_SELL_TEMPLATE_NAME,
        languageCode: WHATSAPP_TEMPLATE_LANGUAGE,
        bodyParams: [buyerName, recommendedOffering.title, productUrl],
      });

      if (!result.success || !result.waId) {
        console.error("whatsapp-cross-sell: send failed for order", order.id, result.error);
        continue;
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
        content: `[template:${CROSS_SELL_TEMPLATE_NAME}] cross-sell: ${recommendedOffering.title}`,
        metaMessageId: result.metaMessageId,
      });

      sentCount++;
    } catch (error) {
      // One order's failure must never abort the rest of the batch.
      console.error("whatsapp-cross-sell: unexpected failure for order", order.id, error);
    }
  }

  return Response.json({ ok: true, processedCount: eligibleOrders.length, sentCount, skippedCount });
}
