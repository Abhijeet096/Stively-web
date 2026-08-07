import { z } from "zod";

export const receiptDataSchema = z.object({
  clientName: z.string().trim().min(1),
  /** Paise. */
  amount: z.number().int().min(0),
  paymentMethod: z.string().trim().min(1),
  transactionReference: z.string().trim().optional(),
  paidAt: z.coerce.date(),
  /** The invoice this payment settles, if any - e.g. "INV-2026-00001". */
  relatedInvoiceNumber: z.string().trim().optional(),
});

export type ReceiptData = z.infer<typeof receiptDataSchema>;
