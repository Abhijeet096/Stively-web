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
