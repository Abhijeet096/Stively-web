import "server-only";

import { prisma } from "@/lib/prisma";
import type { WhatsAppContact, WhatsAppMessage } from "@prisma/client";

export type WhatsAppContactAdminRow = WhatsAppContact & {
  linkedLead: { id: string; name: string } | null;
  linkedSalesLead: { id: string; businessName: string } | null;
  _count: { messages: number };
};

/** The admin list surface's data source - search by phone or name, most recently active first. Mirrors searchCertificatesForAdmin's shape (features/certificates/server/admin-queries.ts) closely. */
export async function searchWhatsAppContactsForAdmin(query?: string): Promise<WhatsAppContactAdminRow[]> {
  return prisma.whatsAppContact.findMany({
    where: query
      ? {
          OR: [
            { phoneNumber: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      linkedLead: { select: { id: true, name: true } },
      linkedSalesLead: { select: { id: true, businessName: true } },
      _count: { select: { messages: true } },
    },
    orderBy: [{ lastInboundAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
}

export type WhatsAppContactWithMessages = WhatsAppContact & {
  linkedLead: { id: string; name: string } | null;
  linkedSalesLead: { id: string; businessName: string } | null;
  messages: WhatsAppMessage[];
};

/** Authorized-staff-only detail view - full message history for one contact, oldest first (conversation reading order). */
export async function getWhatsAppContactForAdmin(contactId: string): Promise<WhatsAppContactWithMessages | null> {
  return prisma.whatsAppContact.findUnique({
    where: { id: contactId },
    include: {
      linkedLead: { select: { id: true, name: true } },
      linkedSalesLead: { select: { id: true, businessName: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}
