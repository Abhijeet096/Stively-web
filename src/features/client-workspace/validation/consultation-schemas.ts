import { z } from "zod";

export const bookConsultationSchema = z.object({
  phone: z.string().trim().min(7, "Enter a valid phone number so we can reach you"),
  message: z.string().trim().min(10, "Tell us a little more - at least 10 characters"),
});
export type BookConsultationInput = z.infer<typeof bookConsultationSchema>;
