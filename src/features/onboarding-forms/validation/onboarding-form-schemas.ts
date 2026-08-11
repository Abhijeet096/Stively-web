import { z } from "zod";

export const sendOnboardingFormSchema = z.object({
  salesProjectId: z.string().min(1),
});
export type SendOnboardingFormInput = z.infer<typeof sendOnboardingFormSchema>;

const optionalText = z.string().trim().max(4000).optional();
const optionalShortText = z.string().trim().max(300).optional();
const dateField = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : undefined));

/**
 * Every fillable text field across all 7 sections, mirroring the design's
 * own `req`/`reqMark` marks verbatim: Company, Primary contact, Email,
 * Project name, Approved scope, and Project start date are the only
 * required fields - everything else (including every file upload) is
 * optional, matching the design's own "our team will follow up on anything
 * left blank" framing. File uploads are handled separately (FormData
 * `File` entries, not part of this schema) since Zod validates strings.
 */
export const onboardingFormContentSchema = z.object({
  formDate: dateField,
  preparedBy: optionalShortText,

  company: z.string().trim().min(1, "Company is required").max(300),
  primaryContact: z.string().trim().min(1, "Primary contact is required").max(300),
  email: z.string().trim().email("Enter a valid email"),
  phone: optionalShortText,
  billingInfo: optionalText,

  projectName: z.string().trim().min(1, "Project name is required").max(300),
  targetAudience: optionalShortText,
  approvedScope: z.string().trim().min(1, "Approved scope is required").max(4000),
  primaryObjective: optionalText,

  brandColors: optionalShortText,
  brandFonts: optionalShortText,

  domainRegistrar: optionalShortText,
  hostingProvider: optionalShortText,
  githubOrg: optionalShortText,
  cloudInfrastructure: optionalShortText,
  apiCredentialsNeeded: optionalShortText,
  thirdPartyServices: optionalShortText,

  productInformation: optionalText,
  legalPages: optionalText,

  primaryCommunicationChannel: optionalShortText,
  primaryDecisionMaker: optionalShortText,
  reviewApprovalContact: optionalShortText,

  projectStartDate: z
    .string()
    .min(1, "Project start date is required")
    .transform((v) => new Date(v)),
  expectedMilestoneDates: optionalShortText,
  notes: optionalText,
  /** Computed by the caller as a real boolean (formData.get("confirmedAccurate") === "on") before this schema ever sees it - a FormData checkbox is either the string "on" or absent, never a parseable boolean literal. */
  confirmedAccurate: z.boolean().refine((v) => v === true, "Please confirm the information is accurate before submitting"),
});
export type OnboardingFormContent = z.infer<typeof onboardingFormContentSchema>;
