import "server-only";

import { invoiceDataSchema } from "../validation/invoice";
import { receiptDataSchema } from "../validation/receipt";
import { InvoiceTemplate } from "../templates/invoice-template";
import { ReceiptTemplate } from "../templates/receipt-template";
import type { DocumentTemplateEntry, DocumentType } from "../types/document";

/**
 * The template registry - the whole point of this engine. Adding a new
 * document type (NDA, Service Agreement, Welcome Kit, Completion
 * Certificate, Warranty Certificate - see ROADMAP.md P2) means adding one
 * entry here, pointing at its own schema/component/prefix. Nothing in
 * server/generate.ts, server/render.ts, server/numbering.ts, or any shared
 * component ever needs to change.
 *
 * Each entry below is individually type-safe (InvoiceTemplate really is
 * typed against InvoiceData, ReceiptTemplate against ReceiptData) - the
 * `any` in this map's value type only erases that per-entry precision at
 * the point of storage, a known/expected TS limitation for a heterogeneous
 * registry (function parameters are contravariant, so a map of "some
 * concrete TData" entries can't unify under a shared `unknown`). Real type
 * safety is enforced twice regardless: once at each entry's own
 * declaration, and again at runtime via `entry.schema.parse()` in
 * server/generate.ts before a template ever sees the data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above: the one place a heterogeneous registry needs it, real safety enforced elsewhere
export const DOCUMENT_TEMPLATES: Record<DocumentType, DocumentTemplateEntry<any>> = {
  INVOICE: {
    numberPrefix: "INV",
    clientDocumentType: "INVOICE",
    titleLabel: "Invoice",
    schema: invoiceDataSchema,
    component: InvoiceTemplate,
  },
  RECEIPT: {
    numberPrefix: "RCT",
    clientDocumentType: "RECEIPT",
    titleLabel: "Receipt",
    schema: receiptDataSchema,
    component: ReceiptTemplate,
  },
};
