import { z } from "zod";

/** One already-mapped CSV row, ready to validate before connector import - mirrors sales-crm's importLeadRowSchema shape. */
export const businessImportRowSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required"),
  ownerName: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  website: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
});
export type BusinessImportRow = z.infer<typeof businessImportRowSchema>;

export const importBusinessesSchema = z.object({
  rows: z.array(businessImportRowSchema).min(1, "No rows to import").max(2000, "Import at most 2000 rows at a time"),
});
export type ImportBusinessesInput = z.infer<typeof importBusinessesSchema>;

export const runWebsiteConnectorSchema = z.object({
  url: z.string().trim().url("Enter a valid URL, including https://"),
});
export type RunWebsiteConnectorInput = z.infer<typeof runWebsiteConnectorSchema>;

export const googlePlacesSearchSchema = z.object({
  query: z.string().trim().min(2, "Enter what you're looking for, e.g. \"restaurants\""),
  location: z.string().trim().min(2, "Enter a city or area, e.g. \"Pune, India\""),
  radiusMeters: z.coerce.number().int().min(500).max(50000).optional(),
});
export type GooglePlacesSearchInput = z.infer<typeof googlePlacesSearchSchema>;

/** "My Businesses" list filters - status/source/industry/min-score/search. */
export const businessFiltersSchema = z.object({
  q: z.string().trim().min(1).optional(),
  status: z.enum(["NEW", "ANALYZED", "PROMOTED", "DISMISSED"]).optional(),
  dataSource: z.enum(["GOOGLE_PLACES", "WEBSITE", "MANUAL_IMPORT", "MANUAL_ENTRY"]).optional(),
  industry: z.string().trim().min(1).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  page: z.coerce.number().int().positive().optional(),
});
export type BusinessFiltersInput = z.infer<typeof businessFiltersSchema>;
