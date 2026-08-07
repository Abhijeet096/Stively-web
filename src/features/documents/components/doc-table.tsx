import "server-only";

import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { documentColors, typeScale } from "../lib/theme";

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: documentColors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: documentColors.primary,
  },
  headerCell: {
    fontSize: typeScale.sm,
    fontWeight: 700,
    color: documentColors.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: 8,
  },
  row: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: documentColors.border,
  },
  rowAlt: {
    backgroundColor: "#FAFAFA",
  },
  cell: {
    fontSize: typeScale.base,
    color: documentColors.foreground,
    padding: 8,
  },
});

export interface DocTableColumn<TRow> {
  header: string;
  /** Flex-basis width share - columns without one split the remaining space evenly. */
  width?: number;
  align?: "left" | "right" | "center";
  render: (row: TRow, index: number) => string;
}

export interface DocTableProps<TRow> {
  columns: DocTableColumn<TRow>[];
  rows: TRow[];
}

/** Generic bordered table - invoice line items today, reusable for any tabular document content later (warranty coverage, handover checklist, ...). */
export function DocTable<TRow>({ columns, rows }: DocTableProps<TRow>) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        {columns.map((col) => (
          <Text
            key={col.header}
            style={[styles.headerCell, { flex: col.width ?? 1, textAlign: col.align ?? "left" }]}
          >
            {col.header}
          </Text>
        ))}
      </View>
      {rows.map((row, index) => (
        <View key={index} style={[styles.row, ...(index % 2 === 1 ? [styles.rowAlt] : [])]}>
          {columns.map((col) => (
            <Text key={col.header} style={[styles.cell, { flex: col.width ?? 1, textAlign: col.align ?? "left" }]}>
              {col.render(row, index)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
