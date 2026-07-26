import { z } from "zod";

/** Weights are validated to be non-negative integers here - the "should sum to ~100" convention is a soft expectation surfaced in the UI, not DB-enforced (see LeadScoringConfig's schema comment). */
export const updateLeadScoringConfigSchema = z.object({
  websiteQualityWeight: z.coerce.number().int().min(0).max(100),
  reviewRatingWeight: z.coerce.number().int().min(0).max(100),
  reviewCountWeight: z.coerce.number().int().min(0).max(100),
  hasWebsiteWeight: z.coerce.number().int().min(0).max(100),
  industryFitWeight: z.coerce.number().int().min(0).max(100),
  growthSignalsWeight: z.coerce.number().int().min(0).max(100),
  contactAvailabilityWeight: z.coerce.number().int().min(0).max(100),
  notes: z.string().trim().max(2000).optional(),
});
export type UpdateLeadScoringConfigInput = z.infer<typeof updateLeadScoringConfigSchema>;
