import { z } from "zod";

export const generateProposalSchema = z.object({
  salesLeadId: z.string().min(1),
  title: z.string().trim().min(1).max(200).optional(),
});

export const regenerateWithCopilotSchema = z.object({
  proposalId: z.string().min(1),
  instruction: z.string().trim().min(1).max(2000),
});

export const packageInputSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100),
  /** Paise - always human-entered, never AI-produced. */
  priceAmount: z.number().int().nonnegative(),
  whatsIncluded: z.array(z.string().trim().min(1)).default([]),
});

export const updatePackagesAndPricingSchema = z.object({
  proposalId: z.string().min(1),
  packages: z.array(packageInputSchema).min(1),
  paymentMilestones: z.array(z.object({ label: z.string().trim().min(1), percent: z.number().min(0).max(100) })).default([]),
});

export const calculatorItemInputSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1).max(100),
  /** Paise - always human-entered, never AI-produced. */
  priceAmount: z.number().int().nonnegative(),
  defaultSelected: z.boolean(),
  description: z.string().trim().max(300).optional(),
});

export const updateCalculatorPricingSchema = z.object({
  proposalId: z.string().min(1),
  items: z.array(calculatorItemInputSchema).min(1),
  paymentMilestones: z.array(z.object({ label: z.string().trim().min(1), percent: z.number().min(0).max(100) })).default([]),
});

export const updateRoiAssumptionsSchema = z.object({
  proposalId: z.string().min(1),
  currentMonthlyLeads: z.number().int().positive().nullable(),
  estimatedUpliftPercent: z.number().positive().nullable(),
  averageDealValue: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const sendProposalSchema = z.object({
  proposalId: z.string().min(1),
});

export const postProposalCommentSchema = z.object({
  token: z.string().min(1),
  type: z.enum(["COMMENT", "QUESTION", "MEETING_REQUEST"]).default("COMMENT"),
  content: z.string().trim().min(1).max(2000),
  clientName: z.string().trim().max(200).optional(),
});

export const acceptProposalSchema = z
  .object({
    token: z.string().min(1),
    selectedPackageId: z.string().trim().min(1).optional(),
    selectedCalculatorItemIds: z.array(z.string().trim().min(1)).optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .refine((data) => !!data.selectedPackageId || (data.selectedCalculatorItemIds && data.selectedCalculatorItemIds.length > 0), {
    message: "Please choose a package or at least one service.",
  });

export const rejectProposalSchema = z.object({
  token: z.string().min(1),
  reason: z.string().trim().max(1000).optional(),
});

export const requestProposalChangesSchema = z.object({
  token: z.string().min(1),
  note: z.string().trim().min(1).max(2000),
});
