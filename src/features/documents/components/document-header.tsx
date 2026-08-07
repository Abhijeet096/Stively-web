import "server-only";

import path from "node:path";
import * as React from "react";
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";

import { documentColors, PAGE, typeScale } from "../lib/theme";

const LOGO_PATH = path.join(process.cwd(), "public/brand/logo-dark-surface.png");
// Real aspect ratio of the source asset (900x263) - see src/components/shared/logo.tsx's own comment.
const LOGO_ASPECT = 900 / 263;
const LOGO_HEIGHT = 26;

const styles = StyleSheet.create({
  band: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: documentColors.ink,
    paddingHorizontal: PAGE.margin,
    paddingVertical: 28,
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    height: LOGO_HEIGHT,
    width: LOGO_HEIGHT * LOGO_ASPECT,
  },
  title: {
    fontSize: typeScale["3xl"],
    fontWeight: 700,
    color: documentColors.inkForeground,
    letterSpacing: 1,
  },
  spacer: {
    height: 84,
  },
});

export interface DocumentHeaderProps {
  /** e.g. "INVOICE", "RECEIPT", "NDA" */
  documentTitle: string;
}

/**
 * The dark band every document opens with - logo on the left, document
 * title on the right, matching the founder's reference invoice exactly.
 * `band` is absolutely positioned so it can bleed to the page edges despite
 * DocumentShell's page margins; `spacer` reserves the equivalent flow-layout
 * height so content placed after this component doesn't sit underneath it.
 */
export function DocumentHeader({ documentTitle }: DocumentHeaderProps) {
  return (
    <>
      <View style={styles.band} fixed>
        <View style={styles.row}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's <Image>, not the HTML element; no alt prop exists in its API, PDF accessibility is a separate model */}
          <Image src={LOGO_PATH} style={styles.logo} />
          <Text style={styles.title}>{documentTitle}</Text>
        </View>
      </View>
      <View style={styles.spacer} />
    </>
  );
}
