import { z } from "zod";
import { PreferredContactMethod, MeetingStatus } from "@prisma/client";

export const scheduleLeadMeetingSchema = z.object({
  leadId: z.string().min(1),
  scheduledAt: z.string().trim().min(1, "Choose a date and time"),
  method: z.nativeEnum(PreferredContactMethod).optional(),
  meetingLink: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type ScheduleLeadMeetingInput = z.infer<typeof scheduleLeadMeetingSchema>;

export const updateLeadMeetingStatusSchema = z.object({
  meetingId: z.string().min(1),
  status: z.nativeEnum(MeetingStatus),
});
export type UpdateLeadMeetingStatusInput = z.infer<typeof updateLeadMeetingStatusSchema>;
