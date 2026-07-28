import { z } from "zod";

export const convertLeadToProjectSchema = z.object({
  salesLeadId: z.string().min(1),
  totalValue: z.coerce.number().int().min(1, "Enter the agreed project value"),
  projectManagerId: z.string().min(1).optional(),
  assignedDeveloperId: z.string().min(1).optional(),
  targetEndDate: z.coerce.date().optional(),
  description: z.string().trim().optional(),
});
export type ConvertLeadToProjectInput = z.infer<typeof convertLeadToProjectSchema>;

export const updateProjectStatusSchema = z.object({
  salesProjectId: z.string().min(1),
  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"]),
});
export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusSchema>;

export const createProjectPaymentSchema = z.object({
  salesProjectId: z.string().min(1),
  amount: z.coerce.number().int().min(1, "Enter a payment amount"),
  label: z.string().trim().max(100).optional(),
  dueDate: z.coerce.date().optional(),
  method: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});
export type CreateProjectPaymentInput = z.infer<typeof createProjectPaymentSchema>;

export const markPaymentPaidSchema = z.object({
  paymentId: z.string().min(1),
  paidAt: z.coerce.date().optional(),
  method: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});
export type MarkPaymentPaidInput = z.infer<typeof markPaymentPaidSchema>;

export const rejectCommissionSchema = z.object({
  commissionId: z.string().min(1),
  reason: z.string().trim().min(1, "A reason is required"),
});
export type RejectCommissionInput = z.infer<typeof rejectCommissionSchema>;

const stringList = z.array(z.string().trim().min(1)).default([]);

export const postProjectUpdateSchema = z.object({
  salesProjectId: z.string().min(1),
  completedItems: stringList.refine((items) => items.length > 0, "Add at least one completed item"),
  plannedNextItems: stringList,
  blockers: z.string().trim().max(1000).optional(),
});
export type PostProjectUpdateInput = z.infer<typeof postProjectUpdateSchema>;

export const createMilestoneSchema = z.object({
  salesProjectId: z.string().min(1),
  label: z.string().trim().min(1, "Enter a milestone name").max(120),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = z.object({
  milestoneId: z.string().min(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]),
  percentComplete: z.coerce.number().int().min(0).max(100).optional(),
});
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

export const deleteMilestoneSchema = z.object({ milestoneId: z.string().min(1) });
export type DeleteMilestoneInput = z.infer<typeof deleteMilestoneSchema>;

export const updateProjectProgressSchema = z.object({
  salesProjectId: z.string().min(1),
  progressPercent: z.coerce.number().int().min(0).max(100),
  warrantyExpiresAt: z.coerce.date().optional().nullable(),
});
export type UpdateProjectProgressInput = z.infer<typeof updateProjectProgressSchema>;
