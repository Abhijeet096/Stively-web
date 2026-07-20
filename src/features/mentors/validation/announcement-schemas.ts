import { z } from "zod";

export const announcementFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Write an announcement first"),
});
export type AnnouncementFormInput = z.infer<typeof announcementFormSchema>;
