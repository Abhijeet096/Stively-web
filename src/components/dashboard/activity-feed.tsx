import Link from "next/link";

import type { RecentActivityItem } from "@/lib/queries/leads";
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

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ActivityFeed({ items }: { items: RecentActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <Link href={`/admin/leads/${item.lead.id}`} className="hover:text-primary">
                  <span className="text-foreground font-medium">{item.lead.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    - {EVENT_LABEL[item.eventType] ?? item.eventType}
                  </span>
                </Link>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {timeAgo(item.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { ActivityFeed };
