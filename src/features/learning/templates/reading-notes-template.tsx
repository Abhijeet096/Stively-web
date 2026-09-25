import "server-only";

import type * as React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

import { registerDocumentFonts } from "@/features/documents/lib/fonts";

registerDocumentFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: "Geist",
    fontSize: 10.5,
    color: "#1D2A24",
    padding: 48,
  },
  eyebrow: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#6B7280",
    marginBottom: 4,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#10231B",
    marginBottom: 20,
  },
  h1: { fontSize: 15, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 12, marginBottom: 5 },
  h3: { fontSize: 11.5, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  paragraph: { marginBottom: 8, lineHeight: 1.5 },
  bulletRow: { flexDirection: "row", marginBottom: 4, paddingLeft: 4 },
  bulletMark: { width: 12 },
  bulletText: { flex: 1, lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 7.5,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

/**
 * A line-based markdown->react-pdf pass, not a full markdown renderer:
 * handles the block-level subset block-text.tsx's own CSS selectors target
 * (#/##/### headings, hyphen/asterisk/numbered bullets, blank-line
 * paragraph breaks) so
 * a downloaded PDF matches the on-page reading material closely enough to
 * be genuinely useful, without pulling in a markdown-to-PDF dependency for
 * what these lesson notes actually use. Inline syntax (**bold**, links)
 * prints as literal characters rather than being styled - an accepted gap
 * for a study-notes export, not a fidelity requirement.
 */
function renderMarkdownBlocks(markdown: string) {
  const lines = markdown.split("\n");
  const blocks: React.ReactNode[] = [];
  let paragraphBuffer: string[] = [];

  function flushParagraph(key: string) {
    if (paragraphBuffer.length === 0) return;
    blocks.push(
      <Text key={key} style={styles.paragraph}>
        {paragraphBuffer.join(" ")}
      </Text>
    );
    paragraphBuffer = [];
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    const key = `l${index}`;

    if (line === "") {
      flushParagraph(`p${key}`);
      return;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushParagraph(`p${key}`);
      const level = heading[1].length;
      const style = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
      blocks.push(
        <Text key={key} style={style}>
          {heading[2]}
        </Text>
      );
      return;
    }
    const bullet = line.match(/^[-*]\s+(.*)$/) ?? line.match(/^\d+\.\s+(.*)$/);
    if (bullet) {
      flushParagraph(`p${key}`);
      blocks.push(
        <View key={key} style={styles.bulletRow}>
          <Text style={styles.bulletMark}>-</Text>
          <Text style={styles.bulletText}>{bullet[1]}</Text>
        </View>
      );
      return;
    }
    paragraphBuffer.push(line);
  });
  flushParagraph("p-final");

  return blocks;
}

export interface ReadingNotesTemplateData {
  courseName: string;
  lessonTitle: string;
  markdown: string;
}

/**
 * The Prime Membership "download reading material" deliverable
 * (src/app/api/learning/[enrollmentId]/blocks/[blockId]/pdf/route.ts) -
 * rendered fresh per request, same never-persisted approach as
 * certificates/server/render.ts, for the same reason (no object storage
 * layer to build/pay for as more lessons get downloaded).
 */
export function ReadingNotesTemplate({ courseName, lessonTitle, markdown }: ReadingNotesTemplateData) {
  return (
    <Document title={lessonTitle}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>{courseName.toUpperCase()}</Text>
        <Text style={styles.lessonTitle}>{lessonTitle}</Text>
        <View>{renderMarkdownBlocks(markdown)}</View>
        <Text style={styles.footer} fixed>
          Stively Technologies · www.stively.com · Downloaded with a Prime Membership
        </Text>
      </Page>
    </Document>
  );
}
