import { z } from "zod";

export const assignMentorFormSchema = z.object({
  studentId: z.string().trim().min(1, "Choose a student"),
  enrollmentId: z.string().trim().optional(),
  isPrimary: z.boolean().default(true),
  notes: z.string().trim().optional(),
});
export type AssignMentorFormInput = z.infer<typeof assignMentorFormSchema>;
