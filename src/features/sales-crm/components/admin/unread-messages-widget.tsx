import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import type { UnreadMessageThread } from "../../server/queries";

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

/**
 * The "readable system" for admin chat - every lead with an unread client
 * message, newest first, in one glance instead of opening each lead to
 * check. Exists because sendMessageToStaff previously only notified an
 * assigned salesperson's linked account - since most leads sit unassigned,
 * most client messages notified nobody at all (fixed alongside this, see
 * message-actions.ts). This widget is the backstop even when a
 * notification is missed or dismissed.
 */
function UnreadMessagesWidget({ threads }: { threads: UnreadMessageThread[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Messages</CardTitle>
        {threads.length > 0 && <Badge variant="default">{threads.length} unread</Badge>}
      </CardHeader>
      <CardContent>
        {threads.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No unread messages" description="You're caught up - new client messages will show up here." />
        ) : (
          <ul className="flex flex-col gap-1">
            {threads.map((thread) => (
              <li key={thread.salesLeadId}>
                <Link
                  href={`/admin/sales-crm/leads/${thread.salesLeadId}`}
                  className="hover:bg-accent/60 flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-foreground truncate text-sm font-medium">{thread.businessName}</span>
                    <span className="text-muted-foreground truncate text-sm">{thread.preview}</span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-muted-foreground text-xs whitespace-nowrap">{formatRelativeTime(thread.createdAt)}</span>
                    {thread.unreadCount > 1 && (
                      <Badge variant="secondary" className="text-[11px]">
                        {thread.unreadCount} new
                      </Badge>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { UnreadMessagesWidget };
