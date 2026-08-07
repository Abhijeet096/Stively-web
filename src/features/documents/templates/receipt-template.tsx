import "server-only";

import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { DocumentShell } from "../components/document-shell";
import { DocumentHeader } from "../components/document-header";
import { DocumentFooter } from "../components/document-footer";
import { MetadataBlock } from "../components/metadata-block";
import { InfoCard } from "../components/info-card";
import { StatusBadge } from "../components/status-badge";
import { SignatureBlock } from "../components/signature-block";
import { PageNumber } from "../components/page-number";
import { documentColors, typeScale } from "../lib/theme";
import { formatDocumentCurrency, formatDocumentDate } from "../lib/format";
import { COMPANY_SIGNATORY } from "../lib/company-info";
import type { DocumentTemplateProps } from "../types/document";
import type { ReceiptData } from "../validation/receipt";

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 16,
  },
  metadataCol: {
    flex: 1,
  },
  billToCol: {
    width: 220,
  },
  amountBox: {
    backgroundColor: documentColors.ink,
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: typeScale.sm,
    color: documentColors.inkMutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: typeScale["3xl"],
    fontWeight: 700,
    color: documentColors.inkForeground,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    gap: 16,
  },
});

/** Payment confirmation - deliberately simpler than the invoice it settles: one figure, a confirmation, no line items. */
export function ReceiptTemplate({ data, documentNumber, issuedAt }: DocumentTemplateProps<ReceiptData>) {
  const billToLines = [data.clientName].filter((line): line is string => !!line);
  const paymentLines = [
    `Method: ${data.paymentMethod}`,
    ...(data.transactionReference ? [`Reference: ${data.transactionReference}`] : []),
    ...(data.relatedInvoiceNumber ? [`For Invoice: ${data.relatedInvoiceNumber}`] : []),
  ];

  return (
    <DocumentShell metaTitle={`Receipt ${documentNumber}`}>
      <DocumentHeader documentTitle="RECEIPT" />

      <View style={styles.topRow}>
        <View style={styles.metadataCol}>
          <MetadataBlock
            rows={[
              { label: "Receipt #", value: documentNumber },
              { label: "Receipt Date", value: formatDocumentDate(issuedAt) },
              { label: "Paid On", value: formatDocumentDate(data.paidAt) },
            ]}
          />
        </View>
        <View style={styles.billToCol}>
          <InfoCard heading="Received From" lines={billToLines} />
        </View>
      </View>

      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Amount Received</Text>
        <Text style={styles.amountValue}>{formatDocumentCurrency(data.amount)}</Text>
        <View style={{ marginTop: 8 }}>
          <StatusBadge label="Paid" tone="success" />
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }}>
          <InfoCard heading="Payment Details" lines={paymentLines} />
        </View>
        <SignatureBlock name={COMPANY_SIGNATORY.name} title={COMPANY_SIGNATORY.title} />
      </View>

      <PageNumber />
      <DocumentFooter />
    </DocumentShell>
  );
}
