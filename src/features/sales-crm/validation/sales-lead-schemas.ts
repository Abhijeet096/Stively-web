import { z } from "zod";

const SALES_LEAD_SOURCES = [
  "WEBSITE",
  "WHATSAPP",
  "LINKEDIN",
  "COLD_CALLING",
  "REFERRAL",
  "INDIAMART",
  "GOOGLE_MAPS",
  "FACEBOOK",
  "INSTAGRAM",
  "MANUAL",
  "OTHER",
] as const;

const SALES_LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
  "ON_HOLD",
] as const;

const LEAD_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export const createSalesLeadSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required"),
  ownerName: z.string().trim().min(2, "Owner name is required"),
  industry: z.string().trim().optional(),
  phone: z.string().trim().min(7, "A valid phone number is required"),
  whatsapp: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  website: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().min(1).default("India"),
  gstNumber: z.string().trim().optional(),
  source: z.enum(SALES_LEAD_SOURCES),
  priority: z.enum(LEAD_PRIORITIES).default("MEDIUM"),
  estimatedValue: z.coerce.number().int().min(0).optional(),
  assignedToId: z.string().min(1).optional(),
});
export type CreateSalesLeadInput = z.infer<typeof createSalesLeadSchema>;

export const updateSalesLeadSchema = z.object({
  businessName: z.string().trim().min(2).optional(),
  ownerName: z.string().trim().min(2).optional(),
  industry: z.string().trim().optional(),
  phone: z.string().trim().min(7).optional(),
  whatsapp: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  website: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  gstNumber: z.string().trim().optional(),
  source: z.enum(SALES_LEAD_SOURCES).optional(),
  status: z.enum(SALES_LEAD_STATUSES).optional(),
  priority: z.enum(LEAD_PRIORITIES).optional(),
  estimatedValue: z.coerce.number().int().min(0).optional(),
});
export type UpdateSalesLeadInput = z.infer<typeof updateSalesLeadSchema>;

export const reassignSalesLeadSchema = z.object({
  salesLeadId: z.string().min(1),
  assigneeId: z.string().min(1, "Choose a salesperson"),
  reason: z.enum(["INITIAL", "SLA_BREACH", "UNAVAILABLE", "MANUAL_OVERRIDE"]).default("MANUAL_OVERRIDE"),
});
export type ReassignSalesLeadInput = z.infer<typeof reassignSalesLeadSchema>;

export const addSalesLeadNoteSchema = z.object({
  salesLeadId: z.string().min(1),
  content: z.string().trim().min(1, "Note cannot be empty"),
});
export type AddSalesLeadNoteInput = z.infer<typeof addSalesLeadNoteSchema>;
