import { z } from "zod";

export const jobFormSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  department: z.string().trim().min(2, "Department is required"),
  description: z.string().trim().min(20, "Description should be at least 20 characters"),
  experience: z.string().trim().min(1, "Experience level is required"),
  skills: z.array(z.string().trim().min(1)).min(1, "Add at least one skill"),
  templateId: z.string().min(1, "Choose an interview template"),
  duration: z.coerce.number().int().min(5, "Minimum 5 minutes").max(120, "Maximum 120 minutes"),
});
export type JobFormInput = z.infer<typeof jobFormSchema>;

export const jobStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "CLOSED"]),
});
