"use server";

import { prisma } from "@/lib/prisma";
import { newsletterSchema, type NewsletterInput } from "@/lib/validations/lead";
import type { ActionResult } from "@/actions/leads";

export async function subscribeNewsletter(input: NewsletterInput): Promise<ActionResult> {
  const parsed = newsletterSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: { status: "ACTIVE", unsubscribedAt: null },
      create: { email: parsed.data.email, source: "website" },
    });
    return { success: true };
  } catch (error) {
    console.error("subscribeNewsletter failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
