import { z } from "zod";

export const inviteClientToPortalSchema = z.object({
  salesLeadId: z.string().min(1),
});
