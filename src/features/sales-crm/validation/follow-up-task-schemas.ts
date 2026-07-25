import { z } from "zod";

export const createFollowUpSchema = z.object({
  salesLeadId: z.string().min(1),
  assignedToId: z.string().min(1, "Assign to a salesperson"),
  type: z.enum(["CALL", "WHATSAPP", "EMAIL", "MEETING", "OTHER"]).default("CALL"),
  dueAt: z.coerce.date({ error: "A due date/time is required" }),
  notes: z.string().trim().optional(),
});
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;

export const rescheduleFollowUpSchema = z.object({
  followUpId: z.string().min(1),
  dueAt: z.coerce.date({ error: "A new due date/time is required" }),
});
export type RescheduleFollowUpInput = z.infer<typeof rescheduleFollowUpSchema>;

export const createTaskSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  description: z.string().trim().optional(),
  salesLeadId: z.string().min(1).optional(),
  assignedToId: z.string().min(1, "Assign to someone"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.coerce.date().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
});
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
