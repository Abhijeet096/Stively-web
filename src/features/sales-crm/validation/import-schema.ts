import { z } from "zod";

/** One already-mapped-and-normalized row, ready to validate before insert - column mapping and source/priority normalization happen client-side (see import-column-mapping.ts) before this schema ever runs. */
export const importLeadRowSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required"),
  ownerName: z.string().trim().min(1, "Owner name is required"),
  phone: z.string().trim().min(7, "A valid phone number is required"),
  whatsapp: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  website: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  gstNumber: z.string().trim().optional(),
  source: z.enum(["WEBSITE", "WHATSAPP", "LINKEDIN", "COLD_CALLING", "REFERRAL", "INDIAMART", "GOOGLE_MAPS", "FACEBOOK", "INSTAGRAM", "MANUAL", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  estimatedValue: z.number().int().min(0).optional(),
  notes: z.string().trim().optional(),
});
export type ImportLeadRow = z.infer<typeof importLeadRowSchema>;

export const importSalesLeadsSchema = z.object({
  rows: z.array(importLeadRowSchema).min(1, "No rows to import").max(2000, "Import at most 2000 rows at a time"),
  assigneeId: z.string().min(1).optional(),
});
export type ImportSalesLeadsInput = z.infer<typeof importSalesLeadsSchema>;
