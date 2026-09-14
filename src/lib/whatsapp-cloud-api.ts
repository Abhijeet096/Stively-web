import "server-only";

import crypto from "crypto";

/**
 * Thin server-only wrapper around Meta's WhatsApp Cloud API (plain REST over
 * fetch - no SDK dependency exists worth adding for four HTTP calls). Same
 * "lazily read env, never crash on import, only fail when actually used"
 * discipline as src/lib/razorpay.ts and src/lib/groq.ts: none of these
 * WHATSAPP_* variables exist in this environment yet (see the architecture
 * audit's Meta-setup checklist), so every exported function here must stay
 * safe to import - and every caller must stay safe to call - before real
 * credentials are ever supplied.
 */

const GRAPH_API_VERSION = "v21.0";

interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
}

/** True once the minimum env vars needed to actually send exist - callers check this before attempting a send rather than letting a network call fail. Deliberately does NOT check WHATSAPP_APP_SECRET/WHATSAPP_VERIFY_TOKEN - those gate the inbound webhook (section below), not outbound sending. */
export function isWhatsAppSendConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

function getCredentials(): WhatsAppCredentials | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return null;
  return { accessToken, phoneNumberId };
}

export interface WhatsAppSendResult {
  success: boolean;
  /** Meta's own message id (`messages[0].id` in a successful response) - the value stored as WhatsAppMessage.metaMessageId. */
  metaMessageId?: string;
  /** Meta's own wa_id for the recipient (`contacts[0].wa_id`) - returned on every successful send, not just inbound deliveries, which is what lets WhatsAppContact.whatsappId (required, non-nullable) be populated for a contact this codebase initiated rather than one that messaged in first. */
  waId?: string;
  error?: string;
}

/**
 * Sends a pre-approved template message - the only kind Meta allows outside
 * an open 24-hour customer-service window (a purchase confirmation days
 * later, a cross-sell nudge, anything business-initiated). `templateName`
 * and `languageCode` come from src/features/whatsapp/lib/config.ts, never
 * hardcoded at the call site, so a real approved template name can be
 * supplied via env without a code change.
 */
export async function sendWhatsAppTemplateMessage(params: {
  to: string;
  templateName: string;
  languageCode: string;
  /** Positional {{1}}, {{2}}... body variables, in order. */
  bodyParams?: string[];
}): Promise<WhatsAppSendResult> {
  const credentials = getCredentials();
  if (!credentials) return { success: false, error: "WhatsApp Cloud API is not configured in this environment." };

  const body = {
    messaging_product: "whatsapp",
    to: params.to,
    type: "template",
    template: {
      name: params.templateName,
      language: { code: params.languageCode },
      ...(params.bodyParams && params.bodyParams.length > 0
        ? { components: [{ type: "body", parameters: params.bodyParams.map((text) => ({ type: "text", text })) }] }
        : {}),
    },
  };

  return sendRaw(credentials, body);
}

/**
 * Sends a free-form text message - only ever valid within an open 24-hour
 * customer-service window (a direct reply to something the contact just
 * sent). The inbound webhook/reply engine is the only intended caller;
 * never use this for a business-initiated send.
 */
export async function sendWhatsAppFreeformMessage(params: { to: string; text: string }): Promise<WhatsAppSendResult> {
  const credentials = getCredentials();
  if (!credentials) return { success: false, error: "WhatsApp Cloud API is not configured in this environment." };

  const body = {
    messaging_product: "whatsapp",
    to: params.to,
    type: "text",
    text: { body: params.text },
  };

  return sendRaw(credentials, body);
}

async function sendRaw(credentials: WhatsAppCredentials, body: unknown): Promise<WhatsAppSendResult> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${credentials.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const json = (await response.json().catch(() => null)) as
      | { messages?: { id: string }[]; contacts?: { wa_id: string }[]; error?: { message?: string; code?: number } }
      | null;

    if (!response.ok || !json?.messages?.[0]?.id) {
      // Never log the access token or the full request body (may contain
      // customer phone numbers/message text) - only Meta's own error
      // description, same "log the useful diagnostic, not the payload"
      // discipline as describeRazorpayError.
      const description = json?.error?.message ?? `HTTP ${response.status}`;
      return { success: false, error: description };
    }

    return { success: true, metaMessageId: json.messages[0].id, waId: json.contacts?.[0]?.wa_id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "WhatsApp send failed" };
  }
}

/**
 * Verifies Meta's `X-Hub-Signature-256` header on an inbound webhook POST -
 * same HMAC-over-the-raw-body shape as the existing Razorpay webhook's
 * signature check (api/webhooks/payment/route.ts), keyed by the app secret
 * instead of the payment webhook secret. Must be called with the raw,
 * unparsed request body - signing is byte-exact, not JSON-semantic.
 */
export function verifyWhatsAppWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signatureHeader) return false;

  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;

  // Constant-time compare - a signature check that short-circuits on the
  // first differing byte leaks timing information an attacker could use to
  // forge a valid signature one byte at a time.
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** The token Meta's webhook GET verification challenge must echo back - set once when configuring the webhook in Meta Business Manager. */
export function getWebhookVerifyToken(): string | undefined {
  return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
}
