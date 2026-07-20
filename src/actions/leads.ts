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
 * `leadType`/`companyName` are passed straight through to the real Lead
 * columns of the same name (fixed from an earlier version of this function
 * that only folded them into the message text, which left every enquiry -
 * student or business - defaulting to leadType STUDENT and never showing
 * up under /admin/businesses). `programInterest` still has nowhere real to
 * land (no free-text column, and matching it to a real Program without a
 * live dropdown is out of scope), so that one stays folded into the message.
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

  // programId stays unset: there's no reliable way to match free-text
  // "program interest" to a real Program row without reintroducing a
  // dropdown backed by a live query, which is out of scope here.
  const message =
    data.enquiryType === "STUDENT" && data.programInterest
      ? `Program of interest: ${data.programInterest}\n\n${data.message}`
      : data.message;

  return submitLead({
    name: data.name,
    email: data.email,
    phone: data.phone,
    message,
    source: "CONTACT_FORM",
    leadType: data.enquiryType,
    companyName: data.enquiryType === "BUSINESS" ? data.companyName : undefined,
  });
}
