import "server-only";

import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { generateClientInviteToken, computeClientInviteExpiry, DEFAULT_CLIENT_INVITE_EXPIRY_DAYS } from "../lib/invite-token";

export interface EnsuredInvite {
  token: string;
  link: string;
}

/**
 * Issues a fresh invite token + expiry on a SalesLead - always regenerates,
 * same "resend = a genuinely new link" precedent as DiscoveryForm's
 * resendDiscoveryForm (AD-016). Never reuses a still-valid token across
 * calls, so a stale copied/leaked link dies the moment a new one is
 * requested. Doesn't send anything itself - callers decide whether/how to
 * notify (a dedicated invite email, or folded into another email like a
 * quote notification - see AD-017).
 */
export async function ensureClientInviteToken(salesLeadId: string): Promise<EnsuredInvite> {
  const token = generateClientInviteToken();
  const expiresAt = computeClientInviteExpiry();

  await prisma.salesLead.update({
    where: { id: salesLeadId },
    data: { inviteToken: token, inviteTokenExpiresAt: expiresAt, inviteSentAt: new Date(), inviteOpenedAt: null, inviteAcceptedAt: null },
  });

  return { token, link: `${siteConfig.url}/invite/${token}` };
}

function buildInviteEmailHtml(businessName: string, link: string, intro?: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
      <p>Hi,</p>
      <p>${intro ?? `Stively has set up a client workspace for <strong>${businessName}</strong> - your quotes, contracts, invoices, payments, and project progress will all live there from now on, in one place.`}</p>
      <p><a href="${link}" style="display:inline-block;background:#2e3a46;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Create your account</a></p>
      <p style="color:#6b7280;font-size:13px;">This link is just for you and expires in ${DEFAULT_CLIENT_INVITE_EXPIRY_DAYS} days.</p>
    </div>
  `;
}

/** Best-effort - never blocks the caller's main action. Callers that want to know delivery succeeded should check the return value; this never throws. */
export async function sendClientInviteEmail(email: string, businessName: string, link: string, intro?: string): Promise<boolean> {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: intro ? `Your Stively quote is ready - set up your account` : "Welcome to Stively - set up your account",
      html: buildInviteEmailHtml(businessName, link, intro),
    });
    return true;
  } catch (error) {
    console.error("sendClientInviteEmail failed:", error);
    return false;
  }
}
