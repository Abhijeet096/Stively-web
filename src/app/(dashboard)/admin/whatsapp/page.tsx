import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { searchWhatsAppContactsForAdmin } from "@/features/whatsapp/server/admin-queries";
import { WhatsAppContactList } from "@/features/whatsapp/components/admin/whatsapp-contact-list";

export const metadata: Metadata = { title: "WhatsApp" };

interface AdminWhatsAppPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminWhatsAppPage({ searchParams }: AdminWhatsAppPageProps) {
  await requireRole("ADMIN");
  const { q } = await searchParams;

  const contacts = await searchWhatsAppContactsForAdmin(q);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">WhatsApp</h1>
      </div>

      <WhatsAppContactList contacts={contacts} query={q ?? ""} />
    </div>
  );
}
