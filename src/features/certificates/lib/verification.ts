import { siteConfig } from "@/config/site";

/** The only thing a certificate's QR code ever encodes - a public URL, nothing else. */
export function getCertificateVerificationUrl(certificateNumber: string): string {
  return `${siteConfig.url}/verify/${certificateNumber}`;
}
