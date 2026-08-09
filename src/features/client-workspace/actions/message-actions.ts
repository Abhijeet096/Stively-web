"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { createNotification } from "@/features/notifications/server/creation";
import { sendMessageFormSchema } from "../validation/message-schemas";

/**
 * Client -> staff. Previously notified only the assigned salesperson's
 * linked account - since most leads sit unassigned (confirmed against real
 * production data before this fix), that meant most client messages
 * notified nobody at all. Now always notifies every ADMIN/SUPER_ADMIN (the
 * founder always sees every client message, regardless of assignment),
 * plus the assigned rep too if there is one and they're not already in
 * that admin set.
 */
export async function sendMessageToStaff(salesLeadId: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole("CLIENT");

  const parsed = sendMessageFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId }, include: { assignedTo: true } });
    if (!lead || lead.clientUserId !== user.id) return { success: false, error: "Not found." };

    await prisma.salesLeadMessage.create({ data: { salesLeadId, senderId: user.id, content: parsed.data.content } });

    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    const recipientIds = new Set(admins.map((a) => a.id));
    if (lead.assignedTo?.userId) recipientIds.add(lead.assignedTo.userId);

    const title = `New message from ${lead.businessName}`;
    const body = parsed.data.content.length > 120 ? `${parsed.data.content.slice(0, 117)}...` : parsed.data.content;

    for (const userId of recipientIds) {
      await createNotification({
        userId,
        type: "MESSAGE_RECEIVED",
        title,
        body,
        link: `/admin/sales-crm/leads/${salesLeadId}`,
      }).catch((error) => console.error("sendMessageToStaff notification failed for", userId, error));
    }

    revalidatePath(`/client/projects/${salesLeadId}`);
    revalidatePath(`/admin/sales-crm/leads/${salesLeadId}`);
    revalidatePath(`/sales/leads/${salesLeadId}`);
    revalidatePath("/admin/sales-crm/dashboard");
    return { success: true };
  } catch (error) {
    console.error("sendMessageToStaff failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Thin (salesLeadId, content) wrapper - exists so a Server Component can
 * pass a client-callable `(content) => Promise<ActionResult>` binding down
 * to SalesLeadMessageThread via `.bind(null, salesLeadId)`. Same boundary-
 * safe pattern as mentors' sendMessageToMentorContent.
 */
export async function sendMessageToStaffContent(salesLeadId: string, content: string): Promise<ActionResult> {
  return sendMessageToStaff(salesLeadId, { content });
}
