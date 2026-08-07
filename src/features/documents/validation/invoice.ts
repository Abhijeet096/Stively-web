import { z } from "zod";

/**
 * Line items are entered by admin at generation time, not sourced from
 * SalesQuote - see ARCHITECTURE_DECISIONS.md AD-004 for why.
 */
export const invoiceLineItemSchema = z.object({
  description: z.string().trim().min(1, "Enter a description"),
  /** Paise, matching every other money field in this codebase. */
  price: z.number().int().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
});

export const invoiceDataSchema = z.object({
  clientName: z.string().trim().min(1),
  clientAddress: z.string().trim().optional(),
  clientPhone: z.string().trim().optional(),
  lineItems: z.array(invoiceLineItemSchema).min(1, "Add at least one line item"),
  dueDate: z.coerce.date(),
});

export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;
export type InvoiceData = z.infer<typeof invoiceDataSchema>;
