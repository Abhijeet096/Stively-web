import type { LeadHistory } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const EVENT_LABEL: Record<string, string> = {
  LEAD_CREATED: "Lead created",
  RE_ENQUIRY: "Re-enquiry received",
  ASSIGNED: "Assigned",
  REASSIGNED: "Reassigned",
  CALL_ATTEMPTED: "Call attempted",
  WHATSAPP_SENT: "WhatsApp sent",
  FOLLOW_UP_SCHEDULED: "Follow-up scheduled",
  STATUS_CHANGED: "Status changed",
  NOTE_ADDED: "Note added",
  CONVERTED: "Converted",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/**
 * `getLeadTimeline` (src/lib/queries/leads.ts) returns oldest-first - a
 * deliberate, general-purpose definition kept unchanged for any future
 * caller. This component reverses it purely for display, since this
 * specific task explicitly asks for "newest first" here - a presentation
 * concern, not a data concern.
 */
function LeadTimeline({ history }: { history: LeadHistory[] }) {
  const newestFirst = [...history].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {newestFirst.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {newestFirst.map((event) => (
              <li key={event.id} className="border-border flex gap-3 border-l-2 pl-4">
                <div className="flex flex-col">
                  <span className="text-foreground text-sm font-medium">
                    {EVENT_LABEL[event.eventType] ?? event.eventType}
                  </span>
                  {event.description && (
                    <span className="text-muted-foreground text-sm">{event.description}</span>
                  )}
                  {event.fromStatus && event.toStatus && (
                    <span className="text-muted-foreground text-sm">
                      {event.fromStatus.replaceAll("_", " ")} →{" "}
                      {event.toStatus.replaceAll("_", " ")}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {formatDateTime(event.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export { LeadTimeline };
