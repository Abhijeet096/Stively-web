import "server-only";

import { prisma } from "@/lib/prisma";
import type { Certificate } from "@prisma/client";

export interface CertificateAdminRow extends Certificate {
  enrollment: { offering: { title: string; slug: string } };
}

/** Search by recipient name or certificate number - the two things an admin (or a support ticket) would actually have on hand. */
export async function searchCertificatesForAdmin(query?: string): Promise<CertificateAdminRow[]> {
  const trimmed = query?.trim();

  return prisma.certificate.findMany({
    where: trimmed
      ? {
          OR: [
            { recipientName: { contains: trimmed, mode: "insensitive" } },
            { certificateNumber: { contains: trimmed, mode: "insensitive" } },
            { recipientEmail: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { enrollment: { select: { offering: { select: { title: true, slug: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
