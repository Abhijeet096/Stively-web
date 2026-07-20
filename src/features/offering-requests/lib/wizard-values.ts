import type { OfferingRequest } from "@prisma/client";

/**
 * Seeds the wizard's client-side field values from a resumed draft: saved
 * `details` JSON + the two real columns (preferredContactMethod/
 * preferredMeetingTime) win over `defaults` (session-derived prefills like
 * name/company) - a user's own edit should never be silently overwritten
 * by their profile data on resume.
 */
export function buildInitialWizardValues(
  request: Pick<OfferingRequest, "details" | "preferredContactMethod" | "preferredMeetingTime">,
  defaults: Record<string, string> = {}
): Record<string, string> {
  const details = (request.details as Record<string, unknown> | null) ?? {};
  const values: Record<string, string> = { ...defaults };
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === "string") values[key] = value;
  }
  if (request.preferredContactMethod) values.preferredContactMethod = request.preferredContactMethod;
  if (request.preferredMeetingTime) values.preferredMeetingTime = request.preferredMeetingTime;
  return values;
}
