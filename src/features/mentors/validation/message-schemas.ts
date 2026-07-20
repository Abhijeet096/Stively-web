import { z } from "zod";

export const sendMessageFormSchema = z.object({
  content: z.string().trim().min(1, "Write a message first").max(4000, "Message is too long"),
});
export type SendMessageFormInput = z.infer<typeof sendMessageFormSchema>;
