import "server-only";

import * as React from "react";
import { Text, StyleSheet } from "@react-pdf/renderer";

import { documentColors, typeScale } from "../lib/theme";

const styles = StyleSheet.create({
  text: {
    position: "absolute",
    bottom: 34,
    right: 40,
    fontSize: typeScale.xs,
    color: documentColors.mutedForeground,
  },
});

/** "Page X of Y" - only meaningful (and only renders) on multi-page documents. */
export function PageNumber() {
  return (
    <Text
      style={styles.text}
      fixed
      render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : "")}
    />
  );
}
