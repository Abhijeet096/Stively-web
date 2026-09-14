/**
 * Meta template configuration - names/language come from env so a real
 * approved template name (Meta reviews and assigns these, they can't be
 * chosen freely) can be supplied without a code change once submitted and
 * approved. Never hardcode a template name here as if it were already
 * approved - these fall back to a clearly-placeholder value specifically so
 * an unconfigured environment fails loudly (see isPostPurchaseTemplateConfigured
 * below) instead of silently trying to send a template Meta will reject.
 *
 * This file is the one place that distinguishes the two send modes this
 * codebase's WhatsApp integration uses:
 *  - TEMPLATE messages (sendWhatsAppTemplateMessage) - required for any
 *    business-initiated send outside an open 24-hour customer-service
 *    window: the post-purchase confirmation, the delayed cross-sell nudge.
 *  - FREE-FORM messages (sendWhatsAppFreeformMessage) - only valid as a
 *    direct reply within that window: the inbound AI reply engine.
 */

export const WHATSAPP_TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en";

const PLACEHOLDER_TEMPLATE_NAME = "__not_configured__";

export const ORDER_CONFIRMATION_TEMPLATE_NAME =
  process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMATION ?? PLACEHOLDER_TEMPLATE_NAME;

export const CROSS_SELL_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_CROSS_SELL ?? PLACEHOLDER_TEMPLATE_NAME;

export function isOrderConfirmationTemplateConfigured(): boolean {
  return ORDER_CONFIRMATION_TEMPLATE_NAME !== PLACEHOLDER_TEMPLATE_NAME;
}

export function isCrossSellTemplateConfigured(): boolean {
  return CROSS_SELL_TEMPLATE_NAME !== PLACEHOLDER_TEMPLATE_NAME;
}

/** Days after purchase the delayed cross-sell nudge is eligible to send - matches the architecture audit's own Phase 1 example timing. */
export const CROSS_SELL_DELAY_DAYS = 3;
