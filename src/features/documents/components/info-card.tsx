import "server-only";

import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { documentColors, typeScale } from "../lib/theme";

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: documentColors.border,
    borderRadius: 6,
    padding: 10,
  },
  heading: {
    fontSize: typeScale.sm,
    fontWeight: 700,
    color: documentColors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  line: {
    fontSize: typeScale.base,
    color: documentColors.foreground,
    marginBottom: 2,
  },
});

export interface InfoCardProps {
  heading: string;
  lines: string[];
}

/** A bordered box for a labeled group of lines - "Bill To", "Payment Method", and similar. */
export function InfoCard({ heading, lines }: InfoCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{heading}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}
