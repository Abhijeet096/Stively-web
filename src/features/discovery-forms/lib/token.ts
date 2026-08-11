import { randomBytes } from "crypto";

/** Same pattern as proposals/lib/token.ts's generateProposalToken - cryptographically random, unguessable, never derived from the lead/form id. */
export function generateDiscoveryFormToken(): string {
  return randomBytes(24).toString("base64url");
}

/** A discovery form isn't time-sensitive the way a priced proposal is - a longer default window than Proposal's 30 days. */
export const DEFAULT_DISCOVERY_FORM_EXPIRY_DAYS = 60;

export function computeDiscoveryFormExpiry(days: number = DEFAULT_DISCOVERY_FORM_EXPIRY_DAYS): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}
