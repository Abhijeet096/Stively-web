"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { getOrIssueCertificate } from "../server/issuance";

export type GenerateCertificateResult = ActionResult & { certificateNumber?: string };

/**
 * The only entry point that ever creates a Certificate row. Ownership is
 * enforced here, not trusted from the caller: the enrollmentId comes from
 * the form, but the studentId is always the authenticated session's own id,
 * so one student can never generate - or even probe eligibility for -
 * another student's enrollment. getOrIssueCertificate re-checks eligibility
 * and idempotency again itself; this action doesn't shortcut that.
 */
export async function generateCertificateAction(enrollmentId: string): Promise<GenerateCertificateResult> {
  const user = await requireRole("STUDENT");

  const result = await getOrIssueCertificate(enrollmentId, user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath(`/student/learning/${enrollmentId}`);
  return { success: true, certificateNumber: result.certificate.certificateNumber };
}
