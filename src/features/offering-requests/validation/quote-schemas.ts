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
  /// CLIENT-role requests only - bridges into the Sales CRM (see
  /// approveCustomQuote). Never collected for a STUDENT-role request, so
  /// both stay optional here and the action itself enforces presence for
  /// the CLIENT branch.
  phone: z.string().trim().min(7, "Enter a valid phone number").optional(),
  paymentPercent: z.coerce.number().int().min(1, "Enter a percentage").max(100, "Can't exceed 100%").optional(),
});
export type ReviewCustomQuoteInput = z.infer<typeof reviewCustomQuoteSchema>;

export const rejectCustomQuoteSchema = z.object({
  requestId: z.string().min(1),
  reason: z.string().trim().max(2000).optional(),
});
export type RejectCustomQuoteInput = z.infer<typeof rejectCustomQuoteSchema>;
