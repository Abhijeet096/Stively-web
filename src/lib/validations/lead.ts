import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  // Optional - the /start-project ad-landing form deliberately doesn't
  // require it (phone/WhatsApp is the real contact channel for that
  // audience). Every other lead-capture form still validates a real email
  // at its own (stricter) schema before calling submitLead. Blank strings
  // are normalized to undefined so we never write "" into the DB - the
  // @@unique([email, leadType]) constraint only tolerates multiple NULLs,
  // not multiple empty strings.
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().email("Enter a valid email address").optional()
  ),
  phone: z.string().trim().min(7, "Enter a valid phone number so we can reach you"),
  message: z.string().trim().optional(),
  source: z.enum(["CONTACT_FORM", "PROGRAM_INTEREST", "CAREERS", "NEWSLETTER_POPUP", "CLIENT_PORTAL", "START_PROJECT", "OTHER"]),
  programId: z.string().optional(),
  leadType: z.enum(["STUDENT", "BUSINESS"]).optional(),
  companyName: z.string().trim().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  estimatedValue: z.number().int().min(0).optional(),
  acquisitionChannel: z
    .enum([
      "WEBSITE",
      "GOOGLE_SEARCH",
      "GOOGLE_ADS",
      "INSTAGRAM",
      "FACEBOOK",
      "LINKEDIN",
      "REFERRAL",
      "DIRECT",
      "INTERNSHALA",
      "NAUKRI",
      "INDEED",
      "MANUAL_ENTRY",
      "OTHER",
    ])
    .optional(),
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

export const START_PROJECT_SERVICES = [
  "WEBSITE",
  "MOBILE_APP",
  "WEB_APP",
  "AI_AUTOMATION",
  "UI_UX_DESIGN",
  "SEO",
] as const;

export const START_PROJECT_SERVICE_LABEL: Record<(typeof START_PROJECT_SERVICES)[number], string> = {
  WEBSITE: "Website",
  MOBILE_APP: "Mobile App",
  WEB_APP: "Web App",
  AI_AUTOMATION: "AI Automation",
  UI_UX_DESIGN: "UI/UX Design",
  SEO: "SEO",
};

export const START_PROJECT_BUDGETS = ["UNDER_25K", "25K_50K", "50K_1L", "1L_PLUS"] as const;

export const START_PROJECT_BUDGET_LABEL: Record<(typeof START_PROJECT_BUDGETS)[number], string> = {
  UNDER_25K: "Under ₹25k",
  "25K_50K": "₹25k–₹50k",
  "50K_1L": "₹50k–₹1L",
  "1L_PLUS": "₹1L+",
};

/**
 * The /start-project ad-landing page's form - built for high-intent Google
 * Ads traffic, so it asks for less than the Contact page (no message
 * minimum) to keep drop-off low. Email IS required though (unlike the
 * shared leadSchema.email below) - it's the only channel the acknowledgement
 * email can reach the visitor on. `submitStartProjectLead`
 * (src/actions/leads.ts) adapts this into `leadSchema`'s shape, folding
 * service/budget/businessType/whatsapp into Lead.metadata Json.
 */
export const startProjectLeadSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  companyName: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number so we can reach you"),
  whatsappNumber: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  service: z.enum(START_PROJECT_SERVICES).optional(),
  budget: z.enum(START_PROJECT_BUDGETS).optional(),
  description: z.string().trim().optional(),
});

export type StartProjectLeadInput = z.infer<typeof startProjectLeadSchema>;
