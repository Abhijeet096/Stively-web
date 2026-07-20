import { z } from "zod";
import { AssignmentRole, OperationPriority, PreferredContactMethod } from "@prisma/client";

export const assignOperationSchema = z.object({
  assigneeId: z.string().trim().min(1, "Choose a team member"),
  role: z.nativeEnum(AssignmentRole),
});
export type AssignOperationInput = z.infer<typeof assignOperationSchema>;

export const internalCommentSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty"),
});
export type InternalCommentInput = z.infer<typeof internalCommentSchema>;

export const scheduleMeetingSchema = z.object({
  scheduledAt: z.string().trim().min(1, "Choose a date and time"),
  method: z.nativeEnum(PreferredContactMethod).optional(),
  notes: z.string().trim().optional(),
});
export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingSchema>;

export const setPrioritySchema = z.object({ priority: z.nativeEnum(OperationPriority) });
export type SetPriorityInput = z.infer<typeof setPrioritySchema>;

/** Empty string clears the due date - same "empty clears" convention as updateLeadSchema's nextFollowUpAt. */
export const setDueDateSchema = z.object({ dueDate: z.string().trim().optional() });
export type SetDueDateInput = z.infer<typeof setDueDateSchema>;

export const setNextActionSchema = z.object({ nextAction: z.string().trim().optional() });
export type SetNextActionInput = z.infer<typeof setNextActionSchema>;
