import "server-only";

import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { documentColors, typeScale } from "../lib/theme";

const TONES = {
  success: { bg: "#EAF7EC", fg: documentColors.success },
  primary: { bg: "#EBF0FE", fg: documentColors.primary },
  warning: { bg: "#FFF4E5", fg: "#B45309" },
  destructive: { bg: "#FDEAEA", fg: documentColors.destructive },
  neutral: { bg: "#F4F4F5", fg: documentColors.mutedForeground },
} as const;

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: typeScale.xs,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export interface StatusBadgeProps {
  label: string;
  tone?: keyof typeof TONES;
}

/** A small colored pill - "PAID", "DUE", "SIGNED", and similar. */
export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  const colors = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}
