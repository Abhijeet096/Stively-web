import "server-only";

import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { documentColors, typeScale } from "../lib/theme";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 90,
    fontSize: typeScale.sm,
    color: documentColors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: typeScale.base,
    fontWeight: 600,
    color: documentColors.foreground,
  },
});

export interface MetadataBlockProps {
  rows: { label: string; value: string }[];
}

/** A stacked label/value list - "Invoice #", "Invoice Date", "Due Date" and similar. */
export function MetadataBlock({ rows }: MetadataBlockProps) {
  return (
    <View>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}
