import { z } from "zod";

/** Validates the shape of one Text Search result before it's trusted as a ConnectorResult input - Google's API is external input like any other. */
export const googlePlaceResultSchema = z.object({
  id: z.string().min(1),
  displayName: z.object({ text: z.string().optional() }).optional(),
  formattedAddress: z.string().optional(),
  nationalPhoneNumber: z.string().optional(),
  websiteUri: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  userRatingCount: z.number().int().min(0).optional(),
  types: z.array(z.string()).optional(),
});
export type GooglePlaceResultValidated = z.infer<typeof googlePlaceResultSchema>;
