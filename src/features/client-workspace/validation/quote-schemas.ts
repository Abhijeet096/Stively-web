import { z } from "zod";

export const respondToQuoteSchema = z.object({
  quoteId: z.string().min(1),
  status: z.enum(["ACCEPTED", "REJECTED"]),
});
export type RespondToQuoteInput = z.infer<typeof respondToQuoteSchema>;
