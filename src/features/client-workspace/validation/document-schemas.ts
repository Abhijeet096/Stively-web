import { z } from "zod";

export const clientDocumentTypeSchema = z.enum([
  "CONTRACT",
  "INVOICE",
  "RECEIPT",
  "WELCOME_PACKET",
  "HANDOVER_PACKAGE",
  "WARRANTY_CERTIFICATE",
  "OTHER",
]);
