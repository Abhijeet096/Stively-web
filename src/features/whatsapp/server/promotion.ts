import "server-only";

import { prisma } from "@/lib/prisma";
import type { WhatsAppContact } from "@prisma/client";
import { notifyAllAdmins } from "@/features/notifications/server/creation";
import { notifyNewLeadCreated } from "@/features/leads/server/notify";
import { setConversationState } from "./contact";

/**
 * The two promotion targets for a qualified WhatsAppContact - see AD-021.
 * Both follow the exact same one-directional "thin raw record -> promoted
 * on qualification" shape already proven three times in this codebase
 * (Business/OfferingRequest/Lead all promote into SalesLead the same way),
 * applied here a fourth time rather than inventing a new mechanism.
 * Idempotent: both check the contact's own linkedLeadId/linkedSalesLeadId
 * first, since WhatsAppContact.linkedLeadId/linkedSalesLeadId are @unique -
 * a second attempt would otherwise fail on the constraint rather than just
 * returning the existing one.
 */

/**
 * Student/product intent -> Lead (leadType STUDENT). Uses LeadSource.OTHER
 * rather than widening the enum (requirement #14: "Do not widen existing
 * enums unnecessarily") - the real channel (WhatsApp, and which offering the
 * conversation was about) is recorded in Lead.metadata instead, which is
 * exactly the extensible field this schema already provides for this.
 */
export async function promoteWhatsAppContactToLead(
  contact: WhatsAppContact,
  detectedOfferingSlug: string | null
): Promise<{ leadId: string } | null> {
  if (contact.linkedLeadId) return { leadId: contact.linkedLeadId };

  try {
    const lead = await prisma.lead.create({
      data: {
        leadType: "STUDENT",
        name: contact.name ?? `WhatsApp contact ${contact.phoneNumber}`,
        phone: contact.phoneNumber,
        source: "OTHER",
        status: "NEW",
        metadata: { channel: "whatsapp", whatsappContactId: contact.id, detectedOfferingSlug },
      },
    });

    await prisma.whatsAppContact.update({
      where: { id: contact.id },
      data: { linkedLeadId: lead.id },
    });
    await setConversationState(contact.id, "CONVERTED");

    try {
      await notifyNewLeadCreated(lead);
    } catch (error) {
      console.error("promoteWhatsAppContactToLead: notifyNewLeadCreated failed:", error);
    }

    return { leadId: lead.id };
  } catch (error) {
    console.error("promoteWhatsAppContactToLead failed:", error);
    return null;
  }
}

/**
 * Agency/business intent -> SalesLead (unassigned, status NEW - lands in
 * the same admin queue every other cold SalesLead does). SalesLeadSource
 * already has a real WHATSAPP value (no enum widening needed here, unlike
 * Lead above). businessName has no real substitute for a bare phone number
 * with no business context yet - same "Unknown" placeholder convention
 * promoteToSalesLead (lead-intelligence/actions/promote-actions.ts) already
 * uses for ownerName when nothing better is known.
 */
export async function promoteWhatsAppContactToSalesLead(
  contact: WhatsAppContact,
  reason: string
): Promise<{ salesLeadId: string } | null> {
  if (contact.linkedSalesLeadId) return { salesLeadId: contact.linkedSalesLeadId };

  try {
    const salesLead = await prisma.salesLead.create({
      data: {
        businessName: contact.name ? `${contact.name} (via WhatsApp)` : `WhatsApp inquiry - ${contact.phoneNumber}`,
        ownerName: contact.name ?? "Unknown",
        phone: contact.phoneNumber,
        whatsapp: contact.phoneNumber,
        source: "WHATSAPP",
        status: "NEW",
        priority: "MEDIUM",
      },
    });

    await prisma.whatsAppContact.update({
      where: { id: contact.id },
      data: { linkedSalesLeadId: salesLead.id },
    });
    await setConversationState(contact.id, "ESCALATED_TO_HUMAN");

    await prisma.salesLeadActivity.create({
      data: { salesLeadId: salesLead.id, type: "LEAD_CREATED", description: `Escalated from WhatsApp: ${reason}` },
    });

    try {
      await notifyAllAdmins({
        type: "LEAD_NEW_INBOUND",
        title: "Agency lead from WhatsApp",
        body: `A WhatsApp conversation was escalated for human follow-up: ${reason}.`,
        link: `/admin/sales-crm/leads/${salesLead.id}`,
      });
    } catch (error) {
      console.error("promoteWhatsAppContactToSalesLead: notifyAllAdmins failed:", error);
    }

    return { salesLeadId: salesLead.id };
  } catch (error) {
    console.error("promoteWhatsAppContactToSalesLead failed:", error);
    return null;
  }
}
