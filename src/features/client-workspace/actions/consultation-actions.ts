"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { submitLead } from "@/actions/leads";
import type { ActionResult } from "@/actions/leads";
import { bookConsultationSchema } from "../validation/consultation-schemas";

/**
 * The in-portal "Book Consultation" - a real, already-authenticated client
 * shouldn't be routed through the anonymous public Contact form to reach
 * sales. This reuses the exact same Lead pipeline (submitLead) so admin/
 * sales sees it identically to any other lead in /admin/leads, just with
 * source: CLIENT_PORTAL instead of CONTACT_FORM to distinguish it, and
 * name/email/companyName pulled from the real account instead of retyped.
 */
export async function bookConsultation(input: unknown): Promise<ActionResult> {
  const user = await requireRole("CLIENT");

  const parsed = bookConsultationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const account = await prisma.user.findUnique({ where: { id: user.id } });
  if (!account?.email) return { success: false, error: "Your account is missing an email address." };

  return submitLead({
    name: account.name ?? "Client",
    email: account.email,
    phone: parsed.data.phone,
    message: parsed.data.message,
    source: "CLIENT_PORTAL",
    leadType: "BUSINESS",
    companyName: account.companyName ?? undefined,
  });
}
