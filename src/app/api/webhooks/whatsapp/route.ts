import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyWhatsAppWebhookSignature, getWebhookVerifyToken, sendWhatsAppFreeformMessage, isWhatsAppSendConfigured } from "@/lib/whatsapp-cloud-api";
import {
  upsertWhatsAppContact,
  markInboundReceived,
  markOutboundSent,
  logWhatsAppMessage,
  recordOptOut,
  setConversationState,
  findWhatsAppContactById,
} from "@/features/whatsapp/server/contact";
import { classifyAgencyIntent, classifyOptOut } from "@/features/whatsapp/lib/routing";
import { generateWhatsAppReply } from "@/features/whatsapp/server/reply-engine";
import { promoteWhatsAppContactToLead, promoteWhatsAppContactToSalesLead } from "@/features/whatsapp/server/promotion";
import { WHATSAPP_AI_DAILY_MESSAGE_LIMIT, WHATSAPP_AI_HISTORY_TURNS, startOfTodayUtc } from "@/features/whatsapp/lib/rate-limit";

/**
 * The production WhatsApp Cloud API webhook endpoint. Both handlers are
 * real and correctly wired, but genuinely inert until real Meta credentials
 * exist in this environment (WHATSAPP_WEBHOOK_VERIFY_TOKEN for the GET
 * challenge below, WHATSAPP_APP_SECRET for the POST signature check) - per
 * requirement #9, this must never appear "live" before that's true. An
 * unconfigured environment fails every POST's signature check (no app
 * secret means verifyWhatsAppWebhookSignature always returns false), which
 * is the correct, safe default: reject, don't silently trust.
 */

/** Meta's one-time verification handshake when this webhook URL is first registered in Meta Business Manager - must echo back hub.challenge exactly, only if hub.verify_token matches WHATSAPP_WEBHOOK_VERIFY_TOKEN. */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = getWebhookVerifyToken();
  if (!verifyToken || mode !== "subscribe" || token !== verifyToken || !challenge) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

interface WhatsAppWebhookPayload {
  entry?: {
    changes?: {
      value?: {
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: { from?: string; id?: string; type?: string; text?: { body?: string } }[];
      };
    }[];
  }[];
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppWebhookSignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Malformed JSON from a signature-verified sender is still handled
    // gracefully - acknowledge with 200 so Meta doesn't retry a payload
    // that will never parse, but do nothing with it.
    return NextResponse.json({ received: true });
  }

  const change = payload.entry?.[0]?.changes?.[0]?.value;
  const message = change?.messages?.[0];
  const contactInfo = change?.contacts?.[0];

  // Not every webhook delivery is a new message (Meta also sends status
  // updates - sent/delivered/read receipts - on the same endpoint). Nothing
  // to process for those; acknowledge and exit.
  if (!message?.id || !message.from || message.type !== "text" || !message.text?.body) {
    return NextResponse.json({ received: true });
  }

  // Meta message-id dedup: an insert-then-catch-P2002 claim, the same
  // pattern used throughout this codebase for "process at most once" (e.g.
  // getOrIssueCertificate's numbering claim) - webhook redelivery is
  // explicitly at-least-once per Meta's own docs, so this is not optional.
  const contact = await upsertWhatsAppContact({
    whatsappId: contactInfo?.wa_id ?? message.from,
    phoneNumber: message.from,
    name: contactInfo?.profile?.name ?? null,
    source: "DIRECT_WHATSAPP",
  });

  try {
    await logWhatsAppMessage({
      whatsappContactId: contact.id,
      direction: "INBOUND",
      content: message.text.body,
      metaMessageId: message.id,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // This exact metaMessageId was already logged by an earlier delivery
      // of the same webhook event (Meta's redelivery is explicitly
      // at-least-once) - stop now rather than generating and sending a
      // second AI reply for a message already answered. Not an error.
      return NextResponse.json({ received: true });
    }
    console.error("whatsapp webhook: message log failed:", error);
    return NextResponse.json({ received: true });
  }

  await markInboundReceived(contact.id);

  await handleInboundMessage(contact.id, message.text.body);

  return NextResponse.json({ received: true });
}

async function handleInboundMessage(contactId: string, text: string): Promise<void> {
  try {
    if (classifyOptOut(text)) {
      await recordOptOut(contactId);
      return;
    }

    const contact = await findWhatsAppContactById(contactId);
    if (!contact || contact.optedOutAt) return;

    if (classifyAgencyIntent(text)) {
      await promoteWhatsAppContactToSalesLead(contact, `Inbound message matched agency intent: "${text.slice(0, 120)}"`);
      await replyToContact(contact.id, contact.phoneNumber, "Thanks for reaching out - I've passed this to our team and someone from Stively will get back to you shortly.");
      return;
    }

    const since = startOfTodayUtc();
    const usedToday = await prisma.whatsAppMessage.count({
      where: { whatsappContactId: contactId, direction: "INBOUND", createdAt: { gte: since } },
    });
    if (usedToday > WHATSAPP_AI_DAILY_MESSAGE_LIMIT) {
      await replyToContact(contact.id, contact.phoneNumber, "You've reached today's message limit - a Stively team member will follow up with you.");
      await setConversationState(contact.id, "ESCALATED_TO_HUMAN");
      return;
    }

    const history = await prisma.whatsAppMessage.findMany({
      where: { whatsappContactId: contactId },
      orderBy: { createdAt: "desc" },
      take: WHATSAPP_AI_HISTORY_TURNS,
      select: { direction: true, content: true },
    });
    history.reverse();
    // The message just logged is the last item in history already (it was
    // inserted before this function was called) - drop it from the context
    // passed as "history" since it's passed separately as the live turn.
    const priorHistory = history.slice(0, -1);

    const result = await generateWhatsAppReply(priorHistory, text);

    await setConversationState(contact.id, result.shouldEscalate ? "ESCALATED_TO_HUMAN" : "AI_HANDLING");

    if (result.shouldEscalate) {
      await promoteWhatsAppContactToSalesLead(contact, result.escalationReason ?? "AI flagged for human follow-up");
    } else if (result.detectedInterest) {
      await promoteWhatsAppContactToLead(contact, result.detectedInterest);
    }

    await replyToContact(contact.id, contact.phoneNumber, result.reply, true);
  } catch (error) {
    console.error("whatsapp webhook: handleInboundMessage failed:", error);
  }
}

async function replyToContact(contactId: string, phoneNumber: string, text: string, aiGenerated = false): Promise<void> {
  if (!isWhatsAppSendConfigured()) return;

  const result = await sendWhatsAppFreeformMessage({ to: phoneNumber, text });
  if (!result.success) {
    console.error("whatsapp webhook: reply send failed:", result.error);
    return;
  }

  await markOutboundSent(contactId);
  await logWhatsAppMessage({
    whatsappContactId: contactId,
    direction: "OUTBOUND",
    content: text,
    metaMessageId: result.metaMessageId,
    aiGenerated,
  });
}
