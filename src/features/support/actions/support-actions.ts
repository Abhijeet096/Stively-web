"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { notifyNewStudentQuery } from "../server/notify";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Student-facing: no name/email/phone in the input at all - the caller is
 * already an authenticated STUDENT, so studentId comes straight from the
 * session, never a client-supplied value. This is the entire reason
 * StudentQuery exists instead of routing here through submitLead - there's
 * nothing left to collect.
 */
export async function submitStudentQuery(message: string): Promise<ActionResult> {
  const user = await requireRole("STUDENT");

  const trimmed = message.trim();
  if (!trimmed) return { success: false, error: "Write your question or issue before sending." };
  if (trimmed.length > MAX_MESSAGE_LENGTH) return { success: false, error: "That message is too long - please shorten it." };

  try {
    const query = await prisma.studentQuery.create({
      data: { studentId: user.id, message: trimmed },
    });

    try {
      await notifyNewStudentQuery(query, { name: user.name ?? null, email: user.email ?? null });
    } catch (error) {
      // Never let a notification failure surface as "your message didn't send" -
      // the row exists, admins can still find it in /admin/student-support either way.
      console.error("submitStudentQuery: notification failed:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("submitStudentQuery failed:", error);
    return { success: false, error: "Something went wrong sending your message. Please try again." };
  }
}

/** Admin-facing: marks a query resolved, keeping who and when. */
export async function resolveStudentQuery(queryId: string): Promise<ActionResult> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");

  try {
    await prisma.studentQuery.update({
      where: { id: queryId },
      data: { status: "RESOLVED", resolvedAt: new Date(), resolvedById: admin.id },
    });
    revalidatePath("/admin/student-support");
    return { success: true };
  } catch (error) {
    console.error("resolveStudentQuery failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
