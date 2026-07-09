import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional(),
  message: z.string().trim().optional(),
  source: z.enum(["CONTACT_FORM", "PROGRAM_INTEREST", "CAREERS", "NEWSLETTER_POPUP", "OTHER"]),
  programId: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
