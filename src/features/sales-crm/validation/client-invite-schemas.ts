import { z } from "zod";

export const inviteClientToPortalSchema = z.object({
  salesLeadId: z.string().min(1),
});

export const acceptClientInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(1, "Enter your name").max(150),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
