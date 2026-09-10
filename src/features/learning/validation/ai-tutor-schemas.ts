import { z } from "zod";

/** Same 500-char cap as askProposalQuestionSchema - long enough for a real question, short enough to bound token cost and blunt a copy-pasted-payload abuse attempt. */
export const sendAiTutorMessageSchema = z.object({
  enrollmentId: z.string().min(1),
  lessonId: z.string().min(1),
  question: z.string().trim().min(1, "Type a question first").max(500, "Keep it under 500 characters"),
});
export type SendAiTutorMessageInput = z.infer<typeof sendAiTutorMessageSchema>;
