import { z } from "zod";

/** Backs the mentor-facing submission review form - "Approve" writes GRADED, "Request revision" writes REVISION_REQUESTED, both via the broadened gradeSubmission() action (learning/actions/admin-review-actions.ts). */
export const reviewSubmissionFormSchema = z.object({
  decision: z.enum(["GRADED", "REVISION_REQUESTED"]),
  score: z.coerce.number().int().min(0).max(100).optional(),
  feedback: z.string().trim().min(1, "Leave feedback for the student"),
});
export type ReviewSubmissionFormInput = z.infer<typeof reviewSubmissionFormSchema>;
