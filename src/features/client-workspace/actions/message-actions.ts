"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { createNotification } from "@/features/notifications/server/creation";
import { sendMessageFormSchema } from "../validation/message-schemas";

/** Client -> staff. Notifies the assigned salesperson's account if there is one - unassigned leads still get the message, just no notification target yet. */
export async function sendMessageToStaff(salesLeadId: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole("CLIENT");

  const parsed = sendMessageFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId }, include: { assignedTo: true } });
    if (!lead || lead.clientUserId !== user.id) return { success: false, error: "Not found." };

    await prisma.salesLeadMessage.create({ data: { salesLeadId, senderId: user.id, content: parsed.data.content } });

    if (lead.assignedTo?.userId) {
      await createNotification({
        userId: lead.assignedTo.userId,
        type: "MESSAGE_RECEIVED",
        title: `New message from ${lead.businessName}`,
        body: parsed.data.content.length > 120 ? `${parsed.data.content.slice(0, 117)}...` : parsed.data.content,
        link: `/sales/leads/${salesLeadId}`,
      }).catch((error) => console.error("sendMessageToStaff notification failed:", error));
    }

    revalidatePath(`/client/projects/${salesLeadId}`);
    revalidatePath(`/admin/sales-crm/leads/${salesLeadId}`);
    revalidatePath(`/sales/leads/${salesLeadId}`);
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
