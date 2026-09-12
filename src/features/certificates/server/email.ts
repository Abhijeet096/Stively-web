import "server-only";

import type { Certificate } from "@prisma/client";

import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { getCertificateVerificationUrl } from "../lib/verification";

/** Same escaping discipline as guest-fulfillment.ts's own copy - names come from what the student typed at signup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SUPPORT_EMAIL = "team@stively.com";
const UDYAM_REGISTRATION = "UDYAM-RJ-17-0578717";

/**
 * The post-issuance email - same table/card/CTA/footer skeleton as
 * buildWelcomeEmail/buildDigitalDownloadEmail (guest-fulfillment.ts), so a
 * student's inbox sees one consistent Stively transactional-email style
 * regardless of which system sent it.
 */
function buildCertificateIssuedEmail(params: {
  firstName: string;
  courseName: string;
  certificateNumber: string;
  verificationUrl: string;
  downloadUrl: string;
}): { subject: string; html: string } {
  const firstName = escapeHtml(params.firstName);
  const courseName = escapeHtml(params.courseName);

  const subject = `Your certificate for ${params.courseName} is ready`;
  const preview = "Your Stively certificate of completion is ready to view and download.";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f6f8;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;border:1px solid #e6e8ee;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

          <tr>
            <td style="padding:24px 28px 0;">
              <div style="font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">Stively</div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px 0;">
              <p style="margin:0 0 14px;font-size:16px;color:#111827;line-height:1.6;">Hi ${firstName},</p>
              <p style="margin:0 0 14px;font-size:16px;color:#111827;line-height:1.6;font-weight:600;">Congratulations - your certificate is ready.</p>
              <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.65;">
                You've successfully completed <strong>${courseName}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbfc;border:1px solid #eef0f4;border-radius:10px;padding:4px 16px;">
                <tr>
                  <td style="padding:10px 0;">
                    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;">Certificate ID</div>
                    <div style="font-size:15px;color:#111827;font-weight:600;margin-top:2px;">${params.certificateNumber}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 0;">
              <a href="${params.downloadUrl}"
                 style="display:block;background:#4f46e5;color:#ffffff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;text-align:center;">
                Download Certificate &rarr;
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 0;">
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                Anyone can verify this certificate is genuine at
                <a href="${params.verificationUrl}" style="color:#4f46e5;">${params.verificationUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 0;">
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.65;">
                <strong style="color:#0f172a;">Need help?</strong><br>
                Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#4f46e5;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 28px;">
              <div style="height:1px;background:#eef0f4;margin-bottom:16px;"></div>
              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
                Regards,<br>
                <strong style="color:#0f172a;">Stively Technologies</strong><br>
                <a href="${siteConfig.url}" style="color:#4f46e5;text-decoration:none;">stively.com</a><br>
                Udyam Registered: ${UDYAM_REGISTRATION}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

export async function sendCertificateIssuedEmail(certificate: Certificate): Promise<void> {
  const firstName = certificate.recipientName.trim().split(/\s+/)[0] || "there";
  const verificationUrl = getCertificateVerificationUrl(certificate.certificateNumber);
  const downloadUrl = `${siteConfig.url}/api/certificates/${certificate.certificateNumber}/pdf`;

  const { subject, html } = buildCertificateIssuedEmail({
    firstName,
    courseName: certificate.courseName,
    certificateNumber: certificate.certificateNumber,
    verificationUrl,
    downloadUrl,
  });

  await resend.emails.send({ from: EMAIL_FROM, to: certificate.recipientEmail, subject, html });
}
