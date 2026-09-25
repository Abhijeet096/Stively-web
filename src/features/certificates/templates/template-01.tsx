import "server-only";

import path from "node:path";
import { readFileSync } from "node:fs";
import * as React from "react";
import { Document, Page, View, Text, Image, StyleSheet, Svg, Defs, LinearGradient, Stop } from "@react-pdf/renderer";

import { registerDocumentFonts } from "@/features/documents/lib/fonts";
import { COMPANY_SIGNATORY } from "@/features/documents/lib/company-info";
import { DocQrCode } from "@/features/documents/components/qr-code";
import { certificateColors, CERT_PAGE } from "../lib/theme";
import { LucideIcon, LaurelWreath, SidebarFlourish, BRAIN, PEN_LINE, SETTINGS_2, LIGHTBULB, TRENDING_UP, CLOCK, GRADUATION_CAP, CLIPBOARD_CHECK, BOOK_OPEN, ROCKET } from "./icons";

registerDocumentFonts();

/**
 * @react-pdf/renderer's image loader decides "local file vs. remote URL" via
 * Node's `url.parse` on the raw path (see `@react-pdf/image`'s
 * `getAbsoluteLocalPath`) - on Windows, a path like `D:\...` gets its drive
 * letter misread as a URL protocol ("d:"), so it's routed to a `fetch()`
 * call instead of `fs.readFile` and silently fails (no logo, no thrown
 * error). Reading the bytes ourselves and passing a `data:` URI sidesteps
 * that path/URL ambiguity entirely - correct on every OS, not just in
 * Vercel's Linux runtime where the raw-path approach happens to work.
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
  { label: "AI Fundamentals\n& Tools", icon: BRAIN },
  { label: "Prompt\nEngineering", icon: PEN_LINE },
  { label: "Practical Projects\n& Workflows", icon: SETTINGS_2 },
  { label: "Real-world\nUse Cases", icon: LIGHTBULB },
  { label: "Career Guidance\n& Opportunities", icon: TRENDING_UP },
] as const;

const SIDEBAR_PILLARS = [
  { label: "Learn", icon: BOOK_OPEN },
  { label: "Build", icon: ROCKET },
  { label: "Grow", icon: TRENDING_UP },
] as const;

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

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
    paddingVertical: CERT_PAGE.margin - 10,
    flexDirection: "column",
  },
  right: {
    width: 168,
    backgroundColor: certificateColors.ink,
    padding: 22,
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
  },
  rightFlourish: {
    position: "absolute",
    top: 0,
    left: 0,
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
  logoTagline: {
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 1.8,
    color: certificateColors.mutedForeground,
    marginTop: 4,
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
    marginTop: 14,
  },
  titleSvg: {
    marginTop: 2,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  subtitleLine: {
    width: 46,
    height: 1,
    backgroundColor: certificateColors.gold,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 4,
    color: certificateColors.gold,
  },
  certifyLine: {
    fontSize: 8.5,
    letterSpacing: 2,
    color: certificateColors.mutedForeground,
    marginTop: 14,
  },
  recipientName: {
    fontSize: 27,
    fontWeight: 700,
    color: certificateColors.ink,
    marginTop: 8,
  },
  hr: {
    marginTop: 8,
    width: 300,
    height: 1,
    backgroundColor: certificateColors.border,
  },
  completedLine: {
    fontSize: 10,
    color: certificateColors.mutedForeground,
    marginTop: 10,
  },
  courseName: {
    fontSize: 14,
    fontWeight: 700,
    color: certificateColors.ink,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 460,
  },
  description: {
    fontSize: 9,
    color: certificateColors.mutedForeground,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 480,
    lineHeight: 1.4,
  },
  skillsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 14,
  },
  skillItem: {
    alignItems: "center",
    width: 84,
  },
  skillBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: certificateColors.goldMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  skillLabel: {
    fontSize: 6.8,
    fontWeight: 700,
    color: certificateColors.foreground,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 1.25,
  },
  statsDivider: {
    marginTop: 14,
    width: 480,
    height: 1,
    backgroundColor: certificateColors.border,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: certificateColors.border,
  },
  statLabel: {
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 0.6,
    color: certificateColors.mutedForeground,
  },
  statValue: {
    fontSize: 10,
    fontWeight: 700,
    color: certificateColors.ink,
    marginTop: 1,
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
    fontSize: 28,
    color: certificateColors.ink,
    marginBottom: -2,
  },
  signatureLine: {
    width: 130,
    height: 1,
    backgroundColor: certificateColors.foreground,
    marginTop: 2,
    marginBottom: 4,
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
  sealWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 92,
    height: 92,
  },
  sealInner: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    borderColor: certificateColors.gold,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    backgroundColor: certificateColors.cream,
  },
  sealText: {
    fontSize: 6.5,
    fontWeight: 700,
    color: certificateColors.gold,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  sealSub: {
    fontSize: 4.4,
    color: certificateColors.mutedForeground,
    textAlign: "center",
    marginTop: 2,
    maxWidth: 52,
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
  pillarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  pillarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillarLabel: {
    fontSize: 9.5,
    fontWeight: 700,
    color: certificateColors.inkForeground,
  },
  quote: {
    fontFamily: "Alex Brush",
    fontSize: 17,
    color: certificateColors.inkForeground,
    textAlign: "center",
    lineHeight: 1.15,
    marginTop: 4,
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
  modulesCompleted: number;
  courseDurationMinutes: number;
  quizzesPassed: number;
}

/**
 * Template 01 - the founder's own master design (Certificate_Template.pptx/
 * .pdf), reproduced with @react-pdf/renderer rather than rendering the PPTX
 * itself (not reliable in a serverless production runtime - see
 * ARCHITECTURE_DECISIONS.md's certificate-system entry). Every dynamic field
 * below comes from a Certificate DB row snapshot, never re-derived live -
 * see src/features/certificates/server/issuance.ts. The stats row
 * (modulesCompleted/courseDurationMinutes/quizzesPassed) is real, counted
 * from the built curriculum at issuance time, not copied from a reference
 * design's placeholder numbers.
 *
 * Deliberately does not reproduce a reference design's ChatGPT/Gemini/
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
  modulesCompleted,
  courseDurationMinutes,
  quizzesPassed,
}: CertificateTemplateData) {
  const issuedLabel = issuedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  return (
    <Document title={`Certificate ${certificateNumber}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outer}>
          <View style={styles.left}>
            <View style={styles.topRow}>
              <View>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image, no alt prop in its API */}
                <Image src={LOGO_ON_CREAM} style={styles.logo} />
                <Text style={styles.logoTagline}>LEARN · BUILD · GROW</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLine}>CERTIFICATE ID: {certificateNumber}</Text>
                <Text style={styles.metaLine}>ISSUED ON: {issuedLabel}</Text>
              </View>
            </View>

            <View style={styles.titleBlock}>
              <Svg width={420} height={54} style={styles.titleSvg}>
                <Defs>
                  <LinearGradient id="titleGradient" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#8A6A1E" />
                    <Stop offset="0.45" stopColor="#E8C766" />
                    <Stop offset="0.75" stopColor="#C9A227" />
                    <Stop offset="1" stopColor="#8A6A1E" />
                  </LinearGradient>
                </Defs>
                <Text
                  x="210"
                  y="42"
                  textAnchor="middle"
                  fill="url(#titleGradient)"
                  style={{ fontFamily: "Geist", fontWeight: 700, fontSize: 42 }}
                >
                  CERTIFICATE
                </Text>
              </Svg>

              <View style={styles.subtitleRow}>
                <View style={styles.subtitleLine} />
                <Text style={styles.subtitle}>OF COMPLETION</Text>
                <View style={styles.subtitleLine} />
              </View>

              <Text style={styles.certifyLine}>THIS IS TO CERTIFY THAT</Text>
              <Text style={styles.recipientName}>{recipientName}</Text>
              <View style={styles.hr} />
              <Text style={styles.completedLine}>has successfully completed the</Text>
              <Text style={styles.courseName}>{courseName}</Text>
              <Text style={styles.description}>{courseDescription}</Text>

              <View style={styles.skillsRow}>
                {SKILLS.map((skill) => (
                  <View key={skill.label} style={styles.skillItem}>
                    <View style={styles.skillBadge}>
                      <LucideIcon nodes={skill.icon as never} size={16} color={certificateColors.gold} strokeWidth={2} />
                    </View>
                    <Text style={styles.skillLabel}>{skill.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.statsDivider} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <LucideIcon nodes={CLOCK as never} size={16} color={certificateColors.gold} />
                  <View>
                    <Text style={styles.statLabel}>COURSE DURATION</Text>
                    <Text style={styles.statValue}>{formatMinutes(courseDurationMinutes)}</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <LucideIcon nodes={GRADUATION_CAP as never} size={16} color={certificateColors.gold} />
                  <View>
                    <Text style={styles.statLabel}>MODULES COMPLETED</Text>
                    <Text style={styles.statValue}>
                      {modulesCompleted} Module{modulesCompleted === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <LucideIcon nodes={CLIPBOARD_CHECK as never} size={16} color={certificateColors.gold} />
                  <View>
                    <Text style={styles.statLabel}>QUIZZES PASSED</Text>
                    <Text style={styles.statValue}>
                      {quizzesPassed} Quiz{quizzesPassed === 1 ? "" : "zes"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.signatureBlock}>
                {/* A signature reads as first-name-only; the full printed name stays on the line below. */}
                <Text style={styles.signatureScript}>Abhijit</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>{COMPANY_SIGNATORY.name}</Text>
                <Text style={styles.signatureTitle}>{COMPANY_SIGNATORY.title}, Stively Technologies</Text>
              </View>

              <View style={styles.sealWrap}>
                <LaurelWreath size={92} color={certificateColors.gold} />
                <View style={styles.sealInner}>
                  <Text style={styles.sealText}>STIVELY{"\n"}CERTIFIED</Text>
                  <Text style={styles.sealSub}>GENERATIVE AI & PROMPT ENGINEERING</Text>
                </View>
              </View>

              <View style={styles.footerRight}>
                <Text style={styles.footerTagline}>BUILDING A MORE CAPABLE GENERATION</Text>
                <Text style={styles.footerMeta}>STIVELY TECHNOLOGIES · www.stively.com</Text>
                <Text style={styles.footerMeta}>UDYAM / MSME REG. NO. · UDYAM-RJ-17-0578717</Text>
              </View>
            </View>
          </View>

          <View style={styles.right}>
            <View style={styles.rightFlourish}>
              <SidebarFlourish width={168} height={CERT_PAGE.height} color={certificateColors.gold} />
            </View>

            <View>
              <Text style={styles.rightHeading}>Practical Skills for{"\n"}a Smarter Future</Text>
              <View style={styles.rightDivider} />
            </View>

            <View>
              {SIDEBAR_PILLARS.map((pillar) => (
                <View key={pillar.label} style={styles.pillarRow}>
                  <View style={styles.pillarBadge}>
                    <LucideIcon nodes={pillar.icon as never} size={13} color={certificateColors.inkForeground} strokeWidth={2.25} />
                  </View>
                  <Text style={styles.pillarLabel}>{pillar.label}</Text>
                </View>
              ))}
              <Text style={styles.quote}>&ldquo;Learn Today, Build Tomorrow&rdquo;</Text>
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
