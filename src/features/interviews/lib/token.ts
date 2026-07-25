import { randomBytes } from "crypto";

/**
 * Cryptographically random, base64url-encoded (URL-safe, no padding) -
 * 24 bytes = 32 characters, ~192 bits of entropy. Not derived from the
 * candidate/job id or any sequential counter, so a token can never be
 * guessed or enumerated from another one - see InterviewLink.token's own
 * schema comment for why this matters (the brief's explicit "cannot be
 * guessed" requirement).
 */
export function generateInterviewToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Default link lifetime if the admin doesn't override it - generous enough that a candidate scheduling a few days out doesn't hit a dead link. */
export const DEFAULT_LINK_EXPIRY_DAYS = 7;

export function computeExpiryDate(days: number = DEFAULT_LINK_EXPIRY_DAYS): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}
