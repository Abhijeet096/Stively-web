"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";

export async function revokeCertificateAction(certificateId: string, reason?: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  const certificate = await prisma.certificate.findUnique({ where: { id: certificateId } });
  if (!certificate) return { success: false, error: "Certificate not found." };
  if (certificate.status === "REVOKED") return { success: true };

  await prisma.certificate.update({
    where: { id: certificateId },
    data: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason?.trim() || null },
  });

  revalidatePath("/admin/certificates");
  return { success: true };
}
