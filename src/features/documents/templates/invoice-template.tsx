import "server-only";

import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { DocumentShell } from "../components/document-shell";
import { DocumentHeader } from "../components/document-header";
import { DocumentFooter } from "../components/document-footer";
import { MetadataBlock } from "../components/metadata-block";
import { InfoCard } from "../components/info-card";
import { DocTable, type DocTableColumn } from "../components/doc-table";
import { SignatureBlock } from "../components/signature-block";
import { PageNumber } from "../components/page-number";
import { documentColors, typeScale } from "../lib/theme";
import { formatDocumentCurrency, formatDocumentDate } from "../lib/format";
import { COMPANY_PAYMENT_INFO, COMPANY_SIGNATORY } from "../lib/company-info";
import type { DocumentTemplateProps } from "../types/document";
import type { InvoiceData, InvoiceLineItem } from "../validation/invoice";

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 16,
  },
  metadataCol: {
    flex: 1,
  },
  billToCol: {
    width: 220,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    marginBottom: 24,
  },
  totalBox: {
    backgroundColor: documentColors.primary,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  totalLabel: {
    fontSize: typeScale.md,
    fontWeight: 700,
    color: documentColors.white,
  },
  totalValue: {
    fontSize: typeScale.xl,
    fontWeight: 700,
    color: documentColors.white,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    gap: 16,
  },
  termsCol: {
    flex: 1,
  },
  termsHeading: {
    fontSize: typeScale.sm,
    fontWeight: 700,
    color: documentColors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  termLine: {
    fontSize: typeScale.sm,
    color: documentColors.mutedForeground,
    marginBottom: 3,
  },
});

const TERMS = [
  "Payment due by the date above.",
  "Prices exclude third-party subscriptions unless specified.",
  "Please reference the invoice number with your payment.",
];

function lineItemTotal(item: InvoiceLineItem): number {
  return Math.round(item.price * (1 - item.discountPercent / 100));
}

const COLUMNS: DocTableColumn<InvoiceLineItem>[] = [
  { header: "No", width: 0.3, render: (_row, i) => String(i + 1) },
  { header: "Description", width: 2.4, render: (row) => row.description },
  { header: "Price", width: 1, align: "right", render: (row) => formatDocumentCurrency(row.price) },
  {
    header: "Discount",
    width: 0.8,
    align: "right",
    render: (row) => (row.discountPercent > 0 ? `${row.discountPercent}%` : "-"),
  },
  { header: "Total", width: 1, align: "right", render: (row) => formatDocumentCurrency(lineItemTotal(row)) },
];

/**
 * Matches the founder's reference PDF: dark header, metadata + bill-to
 * side by side, itemized table, a single Total Due figure (no GST line -
 * confirmed decision, see ROADMAP.md), payment details, terms, signature.
 */
export function InvoiceTemplate({ data, documentNumber, issuedAt }: DocumentTemplateProps<InvoiceData>) {
  const total = data.lineItems.reduce((sum, item) => sum + lineItemTotal(item), 0);
  const billToLines = [data.clientName, data.clientAddress, data.clientPhone].filter(
    (line): line is string => !!line
  );

  return (
    <DocumentShell metaTitle={`Invoice ${documentNumber}`}>
      <DocumentHeader documentTitle="INVOICE" />

      <View style={styles.topRow}>
        <View style={styles.metadataCol}>
          <MetadataBlock
            rows={[
              { label: "Invoice #", value: documentNumber },
              { label: "Invoice Date", value: formatDocumentDate(issuedAt) },
              { label: "Due Date", value: formatDocumentDate(data.dueDate) },
            ]}
          />
        </View>
        <View style={styles.billToCol}>
          <InfoCard heading="Bill To" lines={billToLines} />
        </View>
      </View>

      <DocTable columns={COLUMNS} rows={data.lineItems} />

      <View style={styles.totalsRow}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Due</Text>
          <Text style={styles.totalValue}>{formatDocumentCurrency(total)}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.termsCol}>
          <InfoCard
            heading="Payment Method"
            lines={[
              `Bank: ${COMPANY_PAYMENT_INFO.bankName}`,
              `Account Name: ${COMPANY_PAYMENT_INFO.accountName}`,
              `Account Number: ${COMPANY_PAYMENT_INFO.accountNumber}`,
              `UPI ID: ${COMPANY_PAYMENT_INFO.upiId}`,
            ]}
          />
          <View style={{ marginTop: 12 }}>
            <Text style={styles.termsHeading}>Terms &amp; Conditions</Text>
            {TERMS.map((term) => (
              <Text key={term} style={styles.termLine}>
                • {term}
              </Text>
            ))}
          </View>
        </View>
        <SignatureBlock name={COMPANY_SIGNATORY.name} title={COMPANY_SIGNATORY.title} />
      </View>

      <PageNumber />
      <DocumentFooter />
    </DocumentShell>
  );
}
