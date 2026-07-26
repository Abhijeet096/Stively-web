import { z } from "zod";

export const createAndSendQuoteSchema = z.object({
  salesLeadId: z.string().min(1),
  offeringId: z.string().min(1).optional(),
  title: z.string().trim().min(2, "Give the quote a title"),
  quotedAmount: z.coerce.number().int().min(1, "Enter an amount"),
  message: z.string().trim().max(2000).optional(),
});
export type CreateAndSendQuoteInput = z.infer<typeof createAndSendQuoteSchema>;

export const markQuoteResponseSchema = z.object({
  quoteId: z.string().min(1),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});
export type MarkQuoteResponseInput = z.infer<typeof markQuoteResponseSchema>;
