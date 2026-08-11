import { z } from "zod";

export const sendDiscoveryFormSchema = z.object({
  salesLeadId: z.string().min(1),
  salesProjectId: z.string().min(1).optional(),
});
export type SendDiscoveryFormInput = z.infer<typeof sendDiscoveryFormSchema>;

const optionalText = z.string().trim().max(4000).optional();
const optionalShortText = z.string().trim().max(200).optional();

/** Every fillable field across all 4 sections - shared by the public token submission and the authenticated client submission, since the content shape is identical either way. */
export const discoveryFormContentSchema = z.object({
  // Section 1: Client & Business Information
  clientCompanyName: optionalShortText,
  contactPerson: optionalShortText,
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: optionalShortText,
  businessIndustry: optionalShortText,
  currentWebsite: optionalShortText,
  businessStage: optionalShortText,
  primaryGoal: optionalText,

  // Section 2: Project Requirements
  projectDescription: optionalText,
  problemToSolve: optionalText,
  targetUsers: optionalText,
  importantFeatures: optionalText,
  hasExistingSystem: z.boolean().default(false),
  existingSystemIssues: optionalText,
  successDefinition: optionalText,

  // Section 3: Functional Requirements
  needsUserAccounts: z.boolean().default(false),
  needsAdminDashboard: z.boolean().default(false),
  needsPayments: z.boolean().default(false),
  needsNotifications: z.boolean().default(false),
  needsEmail: z.boolean().default(false),
  needsSearch: z.boolean().default(false),
  needsBooking: z.boolean().default(false),
  needsContentManagement: z.boolean().default(false),
  needsAnalytics: z.boolean().default(false),
  needsIntegrations: z.boolean().default(false),
  needsAiFeatures: z.boolean().default(false),
  needsMobileResponsive: z.boolean().default(false),
  otherFunctionalNeeds: optionalText,
  additionalNotes: optionalText,

  // Section 4: Commercial & Delivery
  desiredLaunchDate: z.coerce.date().optional(),
  priorityLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  expectedBudgetRange: optionalShortText,
  hostingPreference: optionalShortText,
  maintenanceRequired: z.boolean().default(false),
  postLaunchSupport: optionalShortText,
  importantConstraints: optionalText,
  commercialNotes: optionalText,
});
export type DiscoveryFormContent = z.infer<typeof discoveryFormContentSchema>;

export const submitDiscoveryFormByTokenSchema = z.object({
  token: z.string().min(1),
  content: discoveryFormContentSchema,
});

export const submitDiscoveryFormAuthenticatedSchema = z.object({
  formId: z.string().min(1),
  content: discoveryFormContentSchema,
});
