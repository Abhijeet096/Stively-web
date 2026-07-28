import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number so we can reach you"),
  message: z.string().trim().optional(),
  source: z.enum(["CONTACT_FORM", "PROGRAM_INTEREST", "CAREERS", "NEWSLETTER_POPUP", "CLIENT_PORTAL", "OTHER"]),
  programId: z.string().optional(),
  leadType: z.enum(["STUDENT", "BUSINESS"]).optional(),
  companyName: z.string().trim().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

/**
 * Contact page's two-mode enquiry schema. Deliberately a separate schema
 * from `leadSchema` above, not a modification of it - `leadSchema` is the
 * shape the database/action actually accepts today, and stays that way
 * until Lead Intake v1.2's `leadType`/`companyName` fields are real. This
 * schema is the *client-side* shape the Contact form collects, which
 * `submitContactEnquiry` (src/actions/leads.ts) adapts down into
 * `leadSchema`'s shape at submission time - see that action's comments for
 * the full reasoning.
 */
const baseEnquiryFields = {
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number so we can reach you"),
  message: z.string().trim().min(10, "Tell us a little more - at least 10 characters"),
};

export const studentEnquirySchema = z.object({
  enquiryType: z.literal("STUDENT"),
  ...baseEnquiryFields,
  programInterest: z.string().trim().optional(),
});

export const businessEnquirySchema = z.object({
  enquiryType: z.literal("BUSINESS"),
  ...baseEnquiryFields,
  companyName: z.string().trim().min(1, "Company name is required"),
});

export const contactEnquirySchema = z.discriminatedUnion("enquiryType", [
  studentEnquirySchema,
  businessEnquirySchema,
]);

export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;
