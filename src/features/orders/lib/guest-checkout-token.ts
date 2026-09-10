import { randomBytes } from "crypto";

/** Same pattern as every other token in this codebase (invite-token.ts, discovery-forms/lib/token.ts) - cryptographically random, unguessable, never derived from the order/user id. */
export function generateAutoLoginToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Short - this is "come start learning right after you just paid," not a long-lived intake link. Matches the brief's own "valid for 24-48 hours." */
export const DEFAULT_AUTO_LOGIN_EXPIRY_HOURS = 48;

export function computeAutoLoginExpiry(hours: number = DEFAULT_AUTO_LOGIN_EXPIRY_HOURS): Date {
  const expires = new Date();
  expires.setHours(expires.getHours() + hours);
  return expires;
}
