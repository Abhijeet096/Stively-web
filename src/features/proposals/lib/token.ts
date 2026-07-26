import { randomBytes } from "crypto";

/**
 * Cryptographically random, base64url-encoded - 24 bytes = 32 characters,
 * ~192 bits of entropy. Identical pattern to
 * interviews/lib/token.ts's generateInterviewToken - unguessable, never
 * derived from the lead/proposal id or any sequential counter.
 */
export function generateProposalToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Default link lifetime if the salesperson doesn't override it when sending. */
export const DEFAULT_PROPOSAL_EXPIRY_DAYS = 30;

export function computeProposalExpiry(days: number = DEFAULT_PROPOSAL_EXPIRY_DAYS): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}
