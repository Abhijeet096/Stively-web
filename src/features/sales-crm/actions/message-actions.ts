"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { createNotification } from "@/features/notifications/server/creation";
import { sendMessageFormSchema } from "@/features/client-workspace/validation/message-schemas";
import { resolveSalesCrmViewer } from "../server/rbac";

/** Staff -> client. No-ops the notification (message still sends) if the lead's contact hasn't activated a portal account yet - matches every other client-facing notification's "silent no-op if unlinked" precedent. */
export async function sendMessageToClient(salesLeadId: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = sendMessageFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    await prisma.salesLeadMessage.create({ data: { salesLeadId, senderId: user.id, content: parsed.data.content } });

    if (lead.clientUserId) {
      await createNotification({
        userId: lead.clientUserId,
        type: "MESSAGE_RECEIVED",
        title: "New message from Stively",
        body: parsed.data.content.length > 120 ? `${parsed.data.content.slice(0, 117)}...` : parsed.data.content,
        link: `/client/projects/${salesLeadId}`,
      }).catch((error) => console.error("sendMessageToClient notification failed:", error));
    }

    revalidatePath(`/admin/sales-crm/leads/${salesLeadId}`);
    revalidatePath(`/sales/leads/${salesLeadId}`);
    revalidatePath(`/client/projects/${salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("sendMessageToClient failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Thin (salesLeadId, content) wrapper for the .bind() pattern - see client-workspace/actions/message-actions.ts's sendMessageToStaffContent for the full rationale. */
export async function sendMessageToClientContent(salesLeadId: string, content: string): Promise<ActionResult> {
  return sendMessageToClient(salesLeadId, { content });
}
