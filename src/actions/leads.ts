"use server";

import { prisma } from "@/lib/prisma";
import { leadSchema, type LeadInput } from "@/lib/validations/lead";

export type ActionResult = { success: true } | { success: false; error: string };

/**
 * Single server action behind Contact, Program Interest, and Careers forms.
 * The `source` field is what differentiates them - one code path, one table,
 * per the Phase A decision to avoid four near-identical Lead-like models.
 */
export async function submitLead(input: LeadInput): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.lead.create({ data: parsed.data });
    return { success: true };
  } catch (error) {
    console.error("submitLead failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
