"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, MessageCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import type { WhatsAppContactAdminRow } from "../../server/admin-queries";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

const STATE_BADGE: Record<string, "secondary" | "outline" | "success" | "destructive" | "gradient"> = {
  NEW: "outline",
  MENU_SENT: "outline",
  QUALIFYING: "secondary",
  AI_HANDLING: "secondary",
  ESCALATED_TO_HUMAN: "destructive",
  CONVERTED: "success",
  OPTED_OUT: "outline",
};

/** Smallest useful admin visibility (requirement #15) - contacts, conversation state, message count, escalation/promotion state. Not a CRM replacement - reuses the exact list/table conventions CertificateAdminList already established. */
function WhatsAppContactList({ contacts, query }: { contacts: WhatsAppContactAdminRow[]; query: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(query);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/admin/whatsapp${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex max-w-md gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search by phone number or name" />
        <Button type="submit" size="icon" variant="outline" aria-label="Search">
          <Search className="size-4" />
        </Button>
      </form>

      {contacts.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No WhatsApp contacts yet" description="Inbound and post-purchase conversations will show up here." />
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">State</th>
                <th className="px-4 py-3 font-medium">Promoted to</th>
                <th className="px-4 py-3 font-medium">Messages</th>
                <th className="px-4 py-3 font-medium">Last inbound</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/whatsapp/${contact.id}`} className="text-foreground hover:text-primary font-medium">
                      {contact.name || contact.phoneNumber}
                    </Link>
                    {contact.name && <div className="text-muted-foreground text-xs">{contact.phoneNumber}</div>}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{contact.source.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATE_BADGE[contact.conversationState] ?? "outline"}>
                      {contact.optedOutAt ? "OPTED OUT" : contact.conversationState.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {contact.linkedLead ? (
                      <Link href={`/admin/leads/${contact.linkedLead.id}`} className="text-primary hover:underline">
                        Lead: {contact.linkedLead.name}
                      </Link>
                    ) : contact.linkedSalesLead ? (
                      <Link href={`/admin/sales-crm/leads/${contact.linkedSalesLead.id}`} className="text-primary hover:underline">
                        Sales Lead: {contact.linkedSalesLead.businessName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{contact._count.messages}</td>
                  <td className="text-muted-foreground px-4 py-3">{formatDate(contact.lastInboundAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export { WhatsAppContactList };
