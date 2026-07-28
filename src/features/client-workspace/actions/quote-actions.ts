"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { createNotification } from "@/features/notifications/server/creation";
import { respondToQuoteSchema } from "../validation/quote-schemas";

/**
 * The client's own Accept/Decline - the in-portal counterpart to admin's
 * manual markQuoteResponse (sales-crm/actions/quote-actions.ts). Whichever
 * side responds first wins; SENT->ACCEPTED/REJECTED is a one-way
 * transition either way, so no conflict resolution needed.
 */
export async function respondToQuote(input: unknown): Promise<ActionResult> {
  const user = await requireRole("CLIENT");

  const parsed = respondToQuoteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const quote = await prisma.salesQuote.findUnique({
      where: { id: data.quoteId },
      include: { salesLead: { include: { assignedTo: true } } },
    });
    if (!quote) return { success: false, error: "Quote not found." };
    if (quote.salesLead.clientUserId !== user.id) return { success: false, error: "Quote not found." };
    if (quote.status !== "SENT") return { success: false, error: "This quote has already been responded to." };

    await prisma.$transaction([
      prisma.salesQuote.update({ where: { id: data.quoteId }, data: { status: data.status, respondedAt: new Date() } }),
      prisma.salesLeadActivity.create({
        data: {
          salesLeadId: quote.salesLeadId,
          type: data.status === "ACCEPTED" ? "QUOTE_ACCEPTED" : "QUOTE_REJECTED",
          description: `${quote.title} (via client dashboard)`,
        },
      }),
    ]);

    if (quote.salesLead.assignedTo?.userId) {
      await createNotification({
        userId: quote.salesLead.assignedTo.userId,
        type: "SALES_QUOTE_RESPONDED",
        title: `Quote ${data.status === "ACCEPTED" ? "accepted" : "declined"}: ${quote.title}`,
        body: `${quote.salesLead.businessName} responded to your quote from their dashboard.`,
        link: `/sales/leads/${quote.salesLeadId}`,
      }).catch((error) => console.error("respondToQuote notification failed:", error));
    }

    revalidatePath(`/client/projects/${quote.salesLeadId}`);
    revalidatePath(`/admin/sales-crm/leads/${quote.salesLeadId}`);
    revalidatePath(`/sales/leads/${quote.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("respondToQuote failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
