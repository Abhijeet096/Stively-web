import { randomBytes } from "crypto";

/** Same pattern as discovery-forms/lib/token.ts - cryptographically random, unguessable, never derived from the form/project id. */
export function generateOnboardingFormToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Same 60-day window as DiscoveryForm - a real kickoff form isn't something a client fills in one sitting (gathering brand assets, credentials info, etc. often needs a few people internally). */
export const DEFAULT_ONBOARDING_FORM_EXPIRY_DAYS = 60;

export function computeOnboardingFormExpiry(days: number = DEFAULT_ONBOARDING_FORM_EXPIRY_DAYS): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}
