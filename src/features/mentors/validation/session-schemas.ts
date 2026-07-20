import { z } from "zod";
import { LiveSessionType, LiveSessionProvider } from "@prisma/client";

export const mentorSessionFormSchema = z.object({
  sessionType: z.nativeEnum(LiveSessionType),
  title: z.string().trim().min(1, "Title is required"),
  scheduledAt: z.string().trim().min(1, "Choose a date and time"),
  durationMinutes: z.coerce.number().int().positive().optional(),
  meetingUrl: z.string().trim().url().optional().or(z.literal("")),
  provider: z.nativeEnum(LiveSessionProvider).optional(),
  /** Student ids to invite - one for a 1:1, several for group mentoring/office hours. */
  attendeeStudentIds: z.array(z.string().trim().min(1)).min(1, "Invite at least one student"),
});
export type MentorSessionFormInput = z.infer<typeof mentorSessionFormSchema>;
