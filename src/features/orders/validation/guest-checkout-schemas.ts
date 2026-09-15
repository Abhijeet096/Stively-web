import { z } from "zod";

/**
 * Everything needed to start a guest-checkout order in one shape - no
 * separate "create account" step exists in this flow, so name/email/phone
 * are captured here directly rather than through registerSchema.
 */
export const createGuestOrderSchema = z.object({
  offeringId: z.string().min(1),
  name: z.string().trim().min(1, "Enter your name").max(200),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  /**
   * Two fixed pre-payment bumps this flow supports today - see
   * Offering.promptsPackPrice/promptsPack500Price - deliberately a single
   * choice between them (the UI renders them as one either/or upsell, not
   * two independent checkboxes), enforced server-side too: if a tampered
   * request somehow sends both true, createGuestOrder treats promptsPack500
   * as authoritative and ignores promptsPack rather than charging for both.
   */
  promptsPack: z.boolean().default(false),
  promptsPack500: z.boolean().default(false),
});
export type CreateGuestOrderInput = z.infer<typeof createGuestOrderSchema>;

export const verifyGuestPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const acceptOrderAutoLoginSchema = z.object({
  token: z.string().min(1),
});
