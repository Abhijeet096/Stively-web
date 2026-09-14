import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WhatsAppContactWithMessages } from "../../server/admin-queries";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Read-only conversation transcript for authorized staff - message content is sensitive customer data (requirement #16: "no unrestricted public conversation endpoint"), so this only ever renders behind requireRole("ADMIN") in the page component, never a public route. */
function WhatsAppConversationView({ contact }: { contact: WhatsAppContactWithMessages }) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <div className="text-muted-foreground text-xs uppercase">Phone</div>
            <div className="text-foreground font-medium">{contact.phoneNumber}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase">Name</div>
            <div className="text-foreground font-medium">{contact.name ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase">Source</div>
            <div className="text-foreground font-medium">{contact.source.replace(/_/g, " ")}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase">State</div>
            <Badge variant={contact.optedOutAt ? "outline" : "secondary"}>
              {contact.optedOutAt ? "OPTED OUT" : contact.conversationState.replace(/_/g, " ")}
            </Badge>
          </div>
          {contact.linkedLead && (
            <div>
              <div className="text-muted-foreground text-xs uppercase">Promoted to Lead</div>
              <Link href={`/admin/leads/${contact.linkedLead.id}`} className="text-primary font-medium hover:underline">
                {contact.linkedLead.name}
              </Link>
            </div>
          )}
          {contact.linkedSalesLead && (
            <div>
              <div className="text-muted-foreground text-xs uppercase">Promoted to Sales Lead</div>
              <Link href={`/admin/sales-crm/leads/${contact.linkedSalesLead.id}`} className="text-primary font-medium hover:underline">
                {contact.linkedSalesLead.businessName}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {contact.messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">No messages yet.</p>
        ) : (
          contact.messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col gap-1 rounded-lg border p-3 text-sm ${
                message.direction === "INBOUND" ? "bg-muted/40 border-border mr-auto max-w-lg" : "bg-primary/5 border-primary/20 ml-auto max-w-lg"
              }`}
            >
              <p className="text-foreground whitespace-pre-wrap">{message.content}</p>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span>{formatDate(message.createdAt)}</span>
                {message.aiGenerated && <Badge variant="outline">AI</Badge>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { WhatsAppConversationView };
