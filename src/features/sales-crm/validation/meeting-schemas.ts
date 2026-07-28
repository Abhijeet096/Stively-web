import { z } from "zod";
import { PreferredContactMethod, MeetingStatus } from "@prisma/client";

export const scheduleSalesLeadMeetingSchema = z.object({
  salesLeadId: z.string().min(1),
  scheduledAt: z.string().trim().min(1, "Choose a date and time"),
  method: z.nativeEnum(PreferredContactMethod).optional(),
  meetingLink: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type ScheduleSalesLeadMeetingInput = z.infer<typeof scheduleSalesLeadMeetingSchema>;

export const updateSalesLeadMeetingStatusSchema = z.object({
  meetingId: z.string().min(1),
  status: z.nativeEnum(MeetingStatus),
});
export type UpdateSalesLeadMeetingStatusInput = z.infer<typeof updateSalesLeadMeetingStatusSchema>;
