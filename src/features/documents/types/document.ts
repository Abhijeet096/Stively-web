import type { ClientDocumentType } from "@prisma/client";
import type { ReactElement } from "react";
import type { z } from "zod";

/**
 * The fine-grained template-registry key - distinct from the coarser
 * ClientDocumentType (which only buckets the client-facing Documents UI).
 * Deliberately a plain string union, not a Prisma enum: a new document type
 * must be addable by extending the registry alone, never a schema
 * migration. Widened here as each template actually ships (P1: Invoice,
 * Receipt; P2: NDA, Service Agreement, Welcome Kit, Completion Certificate,
 * Warranty Certificate).
 */
export type DocumentType = "INVOICE" | "RECEIPT";

export interface DocumentTemplateEntry<TData> {
  /** Fed to the Document Number Service (e.g. "INV" -> INV-2026-00001) - a template never invents its own number. */
  numberPrefix: string;
  /** Which bucket this shows under in the existing client Documents list. */
  clientDocumentType: ClientDocumentType;
  /** Human title stem - combined with the document number for ClientDocument.title, e.g. "Invoice INV-2026-00001". */
  titleLabel: string;
  schema: z.ZodType<TData>;
  component: (props: DocumentTemplateProps<TData>) => ReactElement;
}

export interface DocumentTemplateProps<TData> {
  data: TData;
  documentNumber: string;
  issuedAt: Date;
}
