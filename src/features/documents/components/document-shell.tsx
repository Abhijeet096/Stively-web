import "server-only";

import * as React from "react";
import { Document, Page, StyleSheet } from "@react-pdf/renderer";

import { registerDocumentFonts } from "../lib/fonts";
import { documentColors, PAGE } from "../lib/theme";

registerDocumentFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: "Geist",
    fontSize: 10,
    color: documentColors.foreground,
    paddingTop: PAGE.margin,
    paddingBottom: PAGE.margin + 24,
    paddingHorizontal: PAGE.margin,
  },
});

export interface DocumentShellProps {
  /** PDF metadata title (shown in the reader's title bar / tab), not rendered on the page itself. */
  metaTitle: string;
  children: React.ReactNode;
}

/**
 * The base every document template renders into - A4, consistent margins,
 * Geist registered as the default font. Nothing document-specific lives
 * here; a template composes its own header/footer/content inside `children`.
 */
export function DocumentShell({ metaTitle, children }: DocumentShellProps) {
  return (
    <Document title={metaTitle}>
      <Page size="A4" style={styles.page}>
        {children}
      </Page>
    </Document>
  );
}
