import "server-only";

import { prisma } from "@/lib/prisma";

export interface PublicCertificateView {
  certificateNumber: string;
  recipientName: string;
  courseName: string;
  completionDate: Date;
  issuedAt: Date | null;
  status: "ISSUED" | "REVOKED";
}

/**
 * The only certificate lookup exposed to anonymous traffic - deliberately
 * returns the minimum needed for the public /verify/[certificateId] page.
 * No enrollmentId, no internal id, no recipientEmail: none of that is
 * "public verification information," and leaking a real email address off
 * a scannable QR code would be a genuine privacy issue.
 */
export async function getPublicCertificateByNumber(certificateNumber: string): Promise<PublicCertificateView | null> {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber },
    select: {
      certificateNumber: true,
      recipientName: true,
      courseName: true,
      completionDate: true,
      issuedAt: true,
      status: true,
    },
  });
  if (!certificate || (certificate.status !== "ISSUED" && certificate.status !== "REVOKED")) return null;

  return certificate as PublicCertificateView;
}
