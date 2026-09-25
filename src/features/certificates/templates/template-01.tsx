import "server-only";

import path from "node:path";
import { readFileSync } from "node:fs";
import * as React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

import { registerDocumentFonts } from "@/features/documents/lib/fonts";
import { COMPANY_SIGNATORY } from "@/features/documents/lib/company-info";
import { DocQrCode } from "@/features/documents/components/qr-code";
import { certificateColors, CERT_PAGE } from "../lib/theme";

registerDocumentFonts();

/**
 * @react-pdf/renderer's image loader decides "local file vs. remote URL" via
 * Node's `url.parse` on the raw path (see `@react-pdf/image`'s
 * `getAbsoluteLocalPath`) - on Windows, a path like `D:\...` gets its drive
 * letter misread as a URL protocol ("d:"), so it's routed to a `fetch()`
 * call instead of `fs.readFile` and silently fails (no logo/signature, no
 * thrown error). Reading the bytes ourselves and passing a `data:` URI
 * sidesteps that path/URL ambiguity entirely - correct on every OS, not just
 * in Vercel's Linux runtime where the raw-path approach happens to work.
 */
function toDataUri(filePath: string): string {
  const buffer = readFileSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = ext === "jpg" ? "jpeg" : ext;
  return `data:image/${mime};base64,${buffer.toString("base64")}`;
}

const LOGO_ON_CREAM = toDataUri(path.join(process.cwd(), "public/brand/logo-light-surface.png"));
const LOGO_ON_INK = toDataUri(path.join(process.cwd(), "public/brand/logo-dark-surface.png"));
const LOGO_ASPECT = 900 / 263;

const SKILLS = [
  "AI Fundamentals & Tools",
  "Prompt Engineering",
  "Practical Projects & Workflows",
  "Real-world Use Cases",
  "Career Guidance & Opportunities",
] as const;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Geist",
    color: certificateColors.foreground,
  },
  outer: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  left: {
    flex: 1,
    backgroundColor: certificateColors.cream,
    paddingHorizontal: CERT_PAGE.margin,
    paddingVertical: CERT_PAGE.margin - 6,
    flexDirection: "column",
  },
  right: {
    width: 168,
    backgroundColor: certificateColors.ink,
    padding: 24,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logo: {
    height: 22,
    width: 22 * LOGO_ASPECT,
  },
  metaBox: {
    alignItems: "flex-end",
  },
  metaLine: {
    fontSize: 7.5,
    color: certificateColors.mutedForeground,
    letterSpacing: 0.6,
  },
  titleBlock: {
    alignItems: "center",
    marginTop: 22,
  },
  title: {
    fontSize: 40,
    fontWeight: 700,
    letterSpacing: 2,
    color: certificateColors.foreground,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 4,
    color: certificateColors.gold,
    marginTop: 6,
  },
  certifyLine: {
    fontSize: 8.5,
    letterSpacing: 2,
    color: certificateColors.mutedForeground,
    marginTop: 16,
  },
  recipientName: {
    fontSize: 30,
    fontWeight: 700,
    color: certificateColors.ink,
    marginTop: 10,
  },
  hr: {
    marginTop: 10,
    width: 320,
    height: 1,
    backgroundColor: certificateColors.border,
  },
  completedLine: {
    fontSize: 10,
    color: certificateColors.mutedForeground,
    marginTop: 12,
  },
  courseName: {
    fontSize: 15,
    fontWeight: 700,
    color: certificateColors.ink,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 460,
  },
  description: {
    fontSize: 8.5,
    color: certificateColors.mutedForeground,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 460,
    lineHeight: 1.5,
  },
  skillsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
    flexWrap: "wrap",
    maxWidth: 480,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: certificateColors.border,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 7,
  },
  skillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: certificateColors.gold,
  },
  skillText: {
    fontSize: 6.5,
    color: certificateColors.foreground,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  signatureBlock: {
    alignItems: "flex-start",
  },
  signatureScript: {
    fontFamily: "Alex Brush",
    fontSize: 30,
    color: certificateColors.ink,
    marginBottom: -2,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 700,
    color: certificateColors.foreground,
  },
  signatureTitle: {
    fontSize: 7.5,
    color: certificateColors.mutedForeground,
  },
  seal: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: certificateColors.gold,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  sealText: {
    fontSize: 6.5,
    fontWeight: 700,
    color: certificateColors.gold,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  sealSub: {
    fontSize: 4.8,
    color: certificateColors.mutedForeground,
    textAlign: "center",
    marginTop: 2,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerTagline: {
    fontSize: 7.5,
    fontWeight: 700,
    color: certificateColors.foreground,
    textAlign: "right",
  },
  footerMeta: {
    fontSize: 6.5,
    color: certificateColors.mutedForeground,
    marginTop: 4,
    textAlign: "right",
  },
  // Right (dark) sidebar
  rightHeading: {
    fontSize: 12.5,
    fontWeight: 700,
    color: certificateColors.inkForeground,
    lineHeight: 1.3,
  },
  rightDivider: {
    marginTop: 8,
    width: 28,
    height: 2,
    backgroundColor: certificateColors.gold,
  },
  badgeMark: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  badgeLetter: {
    fontSize: 26,
    fontWeight: 700,
    color: certificateColors.inkForeground,
  },
  quote: {
    fontSize: 9,
    color: certificateColors.inkMutedForeground,
    textAlign: "center",
    marginTop: 12,
  },
  quoteStrong: {
    color: certificateColors.inkForeground,
    fontWeight: 700,
  },
  qrWrap: {
    alignItems: "center",
  },
  qrCaption: {
    fontSize: 7,
    fontWeight: 700,
    color: certificateColors.inkForeground,
    marginTop: 6,
  },
  qrUrl: {
    fontSize: 6.5,
    color: certificateColors.inkMutedForeground,
    marginTop: 1,
  },
});

export interface CertificateTemplateData {
  certificateNumber: string;
  issuedAt: Date;
  recipientName: string;
  courseName: string;
  courseDescription: string;
  qrDataUrl: string;
}

/**
 * Template 01 - the founder's own master design (Certificate_Template.pptx/
 * .pdf), reproduced with @react-pdf/renderer rather than rendering the PPTX
 * itself (not reliable in a serverless production runtime - see
 * ARCHITECTURE_DECISIONS.md's certificate-system entry). Every dynamic field
 * below comes from a Certificate DB row snapshot, never re-derived live -
 * see src/features/certificates/server/issuance.ts.
 *
 * Deliberately does not reproduce the reference design's ChatGPT/Gemini/
 * Claude logo cluster (third-party trademarks, not a Stively-authorized
 * asset) - the QR/verification block fills that space instead.
 */
export function Template01({
  certificateNumber,
  issuedAt,
  recipientName,
  courseName,
  courseDescription,
  qrDataUrl,
}: CertificateTemplateData) {
  const issuedLabel = issuedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  return (
    <Document title={`Certificate ${certificateNumber}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outer}>
          <View style={styles.left}>
            <View style={styles.topRow}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image, no alt prop in its API */}
              <Image src={LOGO_ON_CREAM} style={styles.logo} />
              <View style={styles.metaBox}>
                <Text style={styles.metaLine}>CERTIFICATE ID: {certificateNumber}</Text>
                <Text style={styles.metaLine}>ISSUED ON: {issuedLabel}</Text>
              </View>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.title}>CERTIFICATE</Text>
              <Text style={styles.subtitle}>OF COMPLETION</Text>
              <Text style={styles.certifyLine}>THIS IS TO CERTIFY THAT</Text>
              <Text style={styles.recipientName}>{recipientName}</Text>
              <View style={styles.hr} />
              <Text style={styles.completedLine}>has successfully completed the</Text>
              <Text style={styles.courseName}>{courseName}</Text>
              <Text style={styles.description}>{courseDescription}</Text>

              <View style={styles.skillsRow}>
                {SKILLS.map((skill) => (
                  <View key={skill} style={styles.skillChip}>
                    <View style={styles.skillDot} />
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.signatureBlock}>
                {/* A signature reads as first-name-only; the full printed name stays on the line below. */}
                <Text style={styles.signatureScript}>Abhijit</Text>
                <Text style={styles.signatureName}>{COMPANY_SIGNATORY.name}</Text>
                <Text style={styles.signatureTitle}>{COMPANY_SIGNATORY.title}, Stively Technologies</Text>
              </View>

              <View style={styles.seal}>
                <Text style={styles.sealText}>STIVELY{"\n"}CERTIFIED</Text>
                <Text style={styles.sealSub}>GENERATIVE AI PROFESSIONAL</Text>
              </View>

              <View style={styles.footerRight}>
                <Text style={styles.footerTagline}>BUILDING A MORE CAPABLE GENERATION</Text>
                <Text style={styles.footerMeta}>STIVELY TECHNOLOGIES · www.stively.com</Text>
                <Text style={styles.footerMeta}>UDYAM / MSME REG. NO. · UDYAM-RJ-17-0578717</Text>
              </View>
            </View>
          </View>

          <View style={styles.right}>
            <View>
              <Text style={styles.rightHeading}>Practical Skills for{"\n"}a Smarter Future</Text>
              <View style={styles.rightDivider} />
            </View>

            <View>
              <View style={styles.badgeMark}>
                <Text style={styles.badgeLetter}>S</Text>
              </View>
              <Text style={styles.quote}>
                <Text style={styles.quoteStrong}>&ldquo;Learn Today Build Tomorrow&rdquo;</Text>
              </Text>
            </View>

            <View style={styles.qrWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image, no alt prop in its API */}
              <Image src={LOGO_ON_INK} style={{ height: 14, width: 14 * LOGO_ASPECT, marginBottom: 10, alignSelf: "center" }} />
              <DocQrCode dataUrl={qrDataUrl} size={64} />
              <Text style={styles.qrCaption}>Verify Certificate</Text>
              <Text style={styles.qrUrl}>stively.com/verify</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
