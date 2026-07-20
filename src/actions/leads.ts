"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { leadSchema, contactEnquirySchema, type LeadInput } from "@/lib/validations/lead";

export type ActionResult = { success: true } | { success: false; error: string };

/**
 * Single server action behind Contact, Program Interest, and Careers forms.
 * The `source` field is what differentiates them - one code path, one table,
 * per the Phase A decision to avoid four near-identical Lead-like models.
 */
export async function submitLead(input: LeadInput): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.lead.create({ data: parsed.data as Prisma.LeadUncheckedCreateInput });
    return { success: true };
  } catch (error) {
    console.error("submitLead failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type ContactFormState = ActionResult | null;

/**
 * Adapter for the Contact page's two-mode form, built for React 19's
 * useActionState (hence the (prevState, formData) signature). Validates the
 * richer Student/Business shape (src/lib/validations/lead.ts), then composes
 * it down into the flat LeadInput shape `submitLead` already accepts and
 * calls that function directly - no duplicated create/error-handling logic.
 *
 * This composition step exists purely because the database doesn't have
 * `leadType`/`companyName` columns yet (Lead Intake v1.2 is a design
 * document, not implemented schema - see docs/architecture/
 * lead-intake-system.md). Business-specific fields get folded into the
 * `message` text with a clear structure so the information isn't lost, not
 * silently dropped. When v1.2's schema fields actually exist, only this
 * function's body needs to change - the form component and its validation
 * schema already collect the right shape.
 */
export async function submitContactEnquiry(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const raw = {
    enquiryType: formData.get("enquiryType"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
    programInterest: formData.get("programInterest") || undefined,
    companyName: formData.get("companyName") || undefined,
  };

  const parsed = contactEnquirySchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please check your details and try again.",
    };
  }

  const data = parsed.data;

  // Compose the richer shape down into today's flat LeadInput - the bridge
  // described above. programId stays unset: there's no reliable way to
  // match free-text "program interest" to a real Program row without
  // reintroducing a dropdown backed by a live query, which is out of scope
  // for "only prepare the form structure."
  const message =
    data.enquiryType === "BUSINESS"
      ? `[Business enquiry]\nCompany: ${data.companyName}\n\n${data.message}`
      : data.programInterest
        ? `[Student enquiry]\nProgram of interest: ${data.programInterest}\n\n${data.message}`
        : `[Student enquiry]\n\n${data.message}`;

  return submitLead({
    name: data.name,
    email: data.email,
    phone: data.phone,
    message,
    source: "CONTACT_FORM",
  });
}
