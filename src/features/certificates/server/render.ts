import "server-only";

import type { Certificate } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { renderDocumentPdf } from "@/features/documents/server/render";
import { generateQrDataUrl } from "@/features/documents/components/qr-code";
import { Template01 } from "../templates/template-01";
import { getCourseCertificateConfig } from "../lib/course-config";
import { getCertificateVerificationUrl } from "../lib/verification";

/**
 * Renders a Certificate row into PDF bytes, fresh, every time it's called -
 * deliberately never persisted (no Cloudinary, no Vercel Blob, no on-disk
 * file). Every field the PDF needs is either snapshotted on the Certificate
 * row itself (recipientName, courseName, completionDate - permanent, never
 * re-derived live) or cheap to look up via its enrollment→offering relation
 * (the certificate-register description text, which does track course-config
 * edits - see ARCHITECTURE_DECISIONS.md's certificate entry for why that
 * one field is the accepted exception). Regenerating on demand means there
 * is no object storage layer to build, monitor, or pay for as the number of
 * issued certificates grows - the DB row IS the certificate.
 */
export async function renderCertificatePdf(certificate: Certificate): Promise<Buffer> {
  const enrollment = await prisma.offeringEnrollment.findUnique({
    where: { id: certificate.enrollmentId },
    select: { offering: { select: { slug: true } } },
  });
  const description =
    (enrollment && getCourseCertificateConfig(enrollment.offering.slug)?.description) ??
    `Awarded for successfully completing ${certificate.courseName}.`;

  const verificationUrl = getCertificateVerificationUrl(certificate.certificateNumber);
  const qrDataUrl = await generateQrDataUrl(verificationUrl);

  const doc = Template01({
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt ?? certificate.createdAt,
    recipientName: certificate.recipientName,
    courseName: certificate.courseName,
    courseDescription: description,
    qrDataUrl,
  });

  return renderDocumentPdf(doc);
}
