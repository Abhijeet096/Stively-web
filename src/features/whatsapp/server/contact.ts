import "server-only";

import type { WhatsAppContact, WhatsAppContactSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Read-only lookup used before sending anything - specifically for the opt-out check (see requirement #13: every future business-initiated send must check this first). No contact existing yet is not opted out - only a real prior optedOutAt counts. */
export async function findWhatsAppContactByPhone(phoneNumber: string): Promise<WhatsAppContact | null> {
  return prisma.whatsAppContact.findUnique({ where: { phoneNumber } });
}

export async function findWhatsAppContactById(id: string): Promise<WhatsAppContact | null> {
  return prisma.whatsAppContact.findUnique({ where: { id } });
}

/**
 * Creates or updates the WhatsAppContact for a real phone number, keyed on
 * phoneNumber (the reliable, always-present identity) rather than id.
 * whatsappId (Meta's own wa_id) is required on the model but is only ever
 * known once Meta has actually returned one - either in an inbound webhook
 * payload's `contacts[].wa_id`, or in a send response's own `contacts[].wa_id`
 * (Meta returns this on every successful send too, not just inbound
 * deliveries) - so this is always called AFTER that point, never before.
 *
 * Deliberately never creates a Lead/SalesLead alongside this - see AD-021:
 * a phone number messaging or being messaged is not, by itself, a
 * qualified lead of either kind.
 */
export async function upsertWhatsAppContact(params: {
  whatsappId: string;
  phoneNumber: string;
  name?: string | null;
  source?: WhatsAppContactSource;
}): Promise<WhatsAppContact> {
  return prisma.whatsAppContact.upsert({
    where: { phoneNumber: params.phoneNumber },
    create: {
      whatsappId: params.whatsappId,
      phoneNumber: params.phoneNumber,
      name: params.name ?? undefined,
      source: params.source ?? "OTHER",
    },
    update: {
      whatsappId: params.whatsappId,
      ...(params.name ? { name: params.name } : {}),
    },
  });
}

export async function markInboundReceived(contactId: string): Promise<void> {
  await prisma.whatsAppContact.update({ where: { id: contactId }, data: { lastInboundAt: new Date() } });
}

export async function markOutboundSent(contactId: string): Promise<void> {
  await prisma.whatsAppContact.update({ where: { id: contactId }, data: { lastOutboundAt: new Date() } });
}

export async function setConversationState(
  contactId: string,
  state: "NEW" | "MENU_SENT" | "QUALIFYING" | "AI_HANDLING" | "ESCALATED_TO_HUMAN" | "CONVERTED" | "OPTED_OUT"
): Promise<void> {
  await prisma.whatsAppContact.update({ where: { id: contactId }, data: { conversationState: state } });
}

/** Sets optedOutAt if not already set - idempotent, since an inbound "STOP" could arrive more than once. */
export async function recordOptOut(contactId: string): Promise<void> {
  await prisma.whatsAppContact.updateMany({
    where: { id: contactId, optedOutAt: null },
    data: { optedOutAt: new Date(), conversationState: "OPTED_OUT" },
  });
}

export async function logWhatsAppMessage(params: {
  whatsappContactId: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  metaMessageId?: string | null;
  aiGenerated?: boolean;
}): Promise<void> {
  await prisma.whatsAppMessage.create({
    data: {
      whatsappContactId: params.whatsappContactId,
      direction: params.direction,
      content: params.content,
      metaMessageId: params.metaMessageId ?? undefined,
      aiGenerated: params.aiGenerated ?? false,
    },
  });
}

/**
 * Best-effort E.164-ish normalization for a free-text phone field (checkout
 * forms accept whatever a buyer types). Strips everything but digits, and
 * assumes a bare 10-digit number is Indian (Stively's only real market
 * today - SalesLead.country already defaults to "India" the same way) -
 * good enough for Meta's `to` field, which just wants digits with country
 * code, no "+". Returns null when the result is implausibly short to be a
 * real number, rather than attempting a send to garbage input.
 */
export function normalizePhoneForWhatsApp(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}
