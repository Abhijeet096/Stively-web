import { z } from "zod";

export const proposeCustomQuoteSchema = z.object({
  requestId: z.string().min(1),
  proposedAmount: z.coerce.number().int().min(1, "Enter an amount"),
  proposedMessage: z.string().trim().max(2000).optional(),
});
export type ProposeCustomQuoteInput = z.infer<typeof proposeCustomQuoteSchema>;

export const reviewCustomQuoteSchema = z.object({
  requestId: z.string().min(1),
  approvedAmount: z.coerce.number().int().min(1, "Enter an amount"),
});
export type ReviewCustomQuoteInput = z.infer<typeof reviewCustomQuoteSchema>;

export const rejectCustomQuoteSchema = z.object({
  requestId: z.string().min(1),
  reason: z.string().trim().max(2000).optional(),
});
export type RejectCustomQuoteInput = z.infer<typeof rejectCustomQuoteSchema>;
