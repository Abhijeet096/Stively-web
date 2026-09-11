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

/** Same generator as generateAutoLoginToken - named separately so a download token's call sites read as what they are, not as a login mechanism. */
export function generateDownloadToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Long-lived relative to auto-login - a paid file download is something someone comes back to re-fetch days or weeks later, not "right after checkout" only. */
export const DEFAULT_DOWNLOAD_EXPIRY_DAYS = 30;

export function computeDownloadTokenExpiry(days: number = DEFAULT_DOWNLOAD_EXPIRY_DAYS): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}
