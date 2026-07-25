import { z } from "zod";

export const inviteCandidateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional(),
  jobId: z.string().min(1, "Choose a job"),
  expiryDays: z.coerce.number().int().min(1).max(60).default(7),
});
export type InviteCandidateInput = z.infer<typeof inviteCandidateSchema>;
