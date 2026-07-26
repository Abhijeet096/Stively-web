import { z } from "zod";

export const updateSalesLeadDiscoverySchema = z.object({
  salesLeadId: z.string().min(1),

  budgetDiscussed: z.boolean(),
  budgetMin: z.number().int().nonnegative().nullable().optional(),
  budgetMax: z.number().int().nonnegative().nullable().optional(),
  budgetNotes: z.string().trim().max(2000).optional(),

  timelineDiscussed: z.boolean(),
  timelineExpectation: z.string().trim().max(500).optional(),

  decisionMakerIdentified: z.boolean(),
  decisionMakerName: z.string().trim().max(200).optional(),
  decisionMakerRole: z.string().trim().max(200).optional(),

  requirementsCaptured: z.boolean(),
  requirementsNotes: z.string().trim().max(4000).optional(),
  painPoints: z.string().trim().max(4000).optional(),

  selectedOfferingIds: z.array(z.string()).default([]),
  customServiceNotes: z.string().trim().max(2000).optional(),
});

export type UpdateSalesLeadDiscoveryInput = z.infer<typeof updateSalesLeadDiscoverySchema>;
