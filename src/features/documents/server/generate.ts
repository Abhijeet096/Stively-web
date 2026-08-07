import "server-only";

import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/cloudinary";
import { nextDocumentNumber } from "./numbering";
import { renderDocumentPdf } from "./render";
import { DOCUMENT_TEMPLATES } from "../lib/registry";
import type { DocumentType } from "../types/document";

export interface GenerateDocumentContext {
  salesLeadId: string;
  /** Set when this document belongs to a specific installment (e.g. an Invoice/Receipt for one SalesProjectPayment). */
  relatedPaymentId?: string;
}

/**
 * The generic orchestrator every document type shares - this is the one
 * place "data collection -> template rendering -> PDF generation ->
 * document storage -> client delivery" actually gets wired together (see
 * ARCHITECTURE_DECISIONS.md's documents-engine entries). It has zero
 * knowledge of what an invoice or a receipt is; it only knows how to look
 * a type up in the registry, validate, render, store, and record - adding
 * a new document type never touches this function.
 *
 * Versioning: if a non-archived document of the same templateType already
 * exists for this (salesLeadId, relatedPaymentId) pair, the new one
 * supersedes it (version + 1, supersedesId set) and the old row is flipped
 * to ARCHIVED in the same transaction - documents are immutable, a
 * regeneration is a new row, never an overwrite.
 */
export async function generateDocument<TType extends DocumentType>(
  templateType: TType,
  rawData: unknown,
  context: GenerateDocumentContext,
  uploadedById?: string
) {
  const entry = DOCUMENT_TEMPLATES[templateType];
  const data = entry.schema.parse(rawData);

  const issuedAt = new Date();
  const documentNumber = await nextDocumentNumber(templateType, entry.numberPrefix, issuedAt);

  // Every registry entry's component renders a <DocumentShell> (which
  // wraps react-pdf's <Document>) - TypeScript just can't verify that
  // through the generic ReactElement return type on DocumentTemplateEntry,
  // since react-pdf's real DocumentProps type isn't cleanly importable
  // (see render.ts's comment). Runtime shape is guaranteed by convention,
  // not by this cast.
  const pdfDocument = entry.component({ data, documentNumber, issuedAt });
  const buffer = await renderDocumentPdf(pdfDocument as Parameters<typeof renderDocumentPdf>[0]);

  const fileName = `${documentNumber}.pdf`;
  const upload = await uploadFile(buffer, "client-documents", fileName);

  const previous = await prisma.clientDocument.findFirst({
    where: {
      salesLeadId: context.salesLeadId,
      templateType,
      relatedPaymentId: context.relatedPaymentId ?? null,
      lifecycleStatus: { not: "ARCHIVED" },
    },
    orderBy: { version: "desc" },
  });

  const created = await prisma.$transaction(async (tx) => {
    if (previous) {
      await tx.clientDocument.update({
        where: { id: previous.id },
        data: { lifecycleStatus: "ARCHIVED" },
      });
    }

    return tx.clientDocument.create({
      data: {
        salesLeadId: context.salesLeadId,
        type: entry.clientDocumentType,
        title: `${entry.titleLabel} ${documentNumber}`,
        fileUrl: upload.secureUrl,
        fileSize: upload.bytes,
        relatedPaymentId: context.relatedPaymentId,
        uploadedById,
        templateType,
        documentNumber,
        version: previous ? previous.version + 1 : 1,
        supersedesId: previous?.id,
        lifecycleStatus: "SENT",
      },
    });
  });

  return created;
}
