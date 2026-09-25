/**
 * Stively's real WhatsApp Business number, E.164 without the leading "+"
 * (the format wa.me's click-to-chat URL expects).
 */
export const WHATSAPP_NUMBER = "919579704823";

/**
 * Per-route pre-filled message so a visitor's chat opens already framed
 * around whatever page they were reading, rather than a blank "Hi" every
 * time. Keyed by exact pathname - add one line here per new service page
 * (see /website-development below) rather than inferring the message from
 * page title text, which is fragile to copy changes.
 */
const WHATSAPP_MESSAGES: Record<string, string> = {
  "/website-development":
    "Hi Stively, I'm interested in your Website Development service. I'd like to discuss my project.",
  "/start-project":
    "Hi Stively, I'd like to start a project. Can we talk?",
};

const DEFAULT_MESSAGE = "Hi Stively, I'd like to know more about your services.";

export function getWhatsAppMessage(pathname: string): string {
  return WHATSAPP_MESSAGES[pathname] ?? DEFAULT_MESSAGE;
}

export function getWhatsAppUrl(pathname: string): string {
  const message = getWhatsAppMessage(pathname);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
