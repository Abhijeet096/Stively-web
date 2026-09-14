import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { getWhatsAppContactForAdmin } from "@/features/whatsapp/server/admin-queries";
import { WhatsAppConversationView } from "@/features/whatsapp/components/admin/whatsapp-conversation-view";

export const metadata: Metadata = { title: "WhatsApp Conversation" };

interface AdminWhatsAppContactPageProps {
  params: Promise<{ contactId: string }>;
}

export default async function AdminWhatsAppContactPage({ params }: AdminWhatsAppContactPageProps) {
  await requireRole("ADMIN");
  const { contactId } = await params;

  const contact = await getWhatsAppContactForAdmin(contactId);
  if (!contact) notFound();

  return (
    <div className="flex flex-col gap-8 p-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">{contact.name || contact.phoneNumber}</h1>
      <WhatsAppConversationView contact={contact} />
    </div>
  );
}
