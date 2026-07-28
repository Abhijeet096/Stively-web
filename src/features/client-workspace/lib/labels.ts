import type { ClientDocumentType } from "@prisma/client";

export const CLIENT_DOCUMENT_TYPE_LABEL: Record<ClientDocumentType, string> = {
  CONTRACT: "Contract",
  INVOICE: "Invoice",
  RECEIPT: "Receipt",
  WELCOME_PACKET: "Welcome packet",
  HANDOVER_PACKAGE: "Handover package",
  WARRANTY_CERTIFICATE: "Warranty certificate",
  OTHER: "Other",
};
