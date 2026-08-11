import { randomBytes } from "crypto";

/** Same pattern as proposals/lib/token.ts and discovery-forms/lib/token.ts - cryptographically random, unguessable, never derived from the lead/user id. */
export function generateClientInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Shorter than DiscoveryForm's 60 days - this is "come set up your account," meant to be acted on soon after a quote or a direct invite, not a long-lived intake form. */
export const DEFAULT_CLIENT_INVITE_EXPIRY_DAYS = 14;

export function computeClientInviteExpiry(days: number = DEFAULT_CLIENT_INVITE_EXPIRY_DAYS): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}
