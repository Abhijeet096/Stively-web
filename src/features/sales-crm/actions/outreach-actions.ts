"use server";

import { revalidatePath } from "next/cache";
import type { SalesLeadOutreach } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { resolveSalesCrmViewer } from "../server/rbac";
import { logSalesLeadActivity } from "../server/creation";
import { buildOutreachMessages, leadHasNamedContact } from "../server/outreach-prompt-service";
import { requestOutreachContent } from "../server/outreach-engine";

async function resolveActorId(userId: string): Promise<string | undefined> {
  const linked = await prisma.teamMember.findUnique({ where: { userId } });
  return linked?.id;
}

export type GenerateOutreachResult = ActionResult & { outreach?: SalesLeadOutreach };

/**
 * One click, one Groq call, four ready-to-send channels - the "Generate
 * Outreach" button on a lead's detail page (shared by /admin/sales-crm and
 * the /sales portal). Every generation is kept as a new SalesLeadOutreach
 * row (never overwritten in place) so a salesperson can see what was sent
 * before, same "history not upsert" convention as AILeadReport.
 */
export async function generateOutreach(salesLeadId: string): Promise<GenerateOutreachResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    const messages = buildOutreachMessages(lead);
    const content = await requestOutreachContent(messages);

    const actorId = await resolveActorId(user.id);

    const outreach = await prisma.salesLeadOutreach.create({
      data: {
        salesLeadId,
        whatsappMessage: content.whatsappMessage,
        emailSubject: content.emailSubject,
        emailBody: content.emailBody,
        coldCallScript: content.coldCallScript,
        linkedinMessage: leadHasNamedContact(lead) ? content.linkedinMessage : null,
        modelUsed: DEFAULT_GROQ_MODEL,
        generatedById: actorId ?? null,
      },
    });

    await logSalesLeadActivity({
      salesLeadId,
      type: "OUTREACH_GENERATED",
      description: "Generated AI outreach (WhatsApp, email, cold call script, LinkedIn)",
      performedById: actorId ?? null,
    });

    revalidatePath(`/admin/sales-crm/leads/${salesLeadId}`);
    revalidatePath(`/sales/leads/${salesLeadId}`);

    return { success: true, outreach };
  } catch (error) {
    console.error("generateOutreach failed:", error);
    return { success: false, error: "Couldn't generate outreach right now. Please try again." };
  }
}
