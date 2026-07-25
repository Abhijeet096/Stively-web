import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { SalesLeadActivity, TeamMember } from "@prisma/client";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

const ACTIVITY_LABEL: Record<string, string> = {
  LEAD_CREATED: "Lead created",
  LEAD_ASSIGNED: "Lead assigned",
  LEAD_REASSIGNED: "Lead reassigned",
  CALL_LOGGED: "Call logged",
  WHATSAPP_LOGGED: "WhatsApp message logged",
  EMAIL_LOGGED: "Email logged",
  STATUS_CHANGED: "Status changed",
  NOTE_ADDED: "Note added",
  ATTACHMENT_ADDED: "Attachment added",
  FOLLOW_UP_SCHEDULED: "Follow-up scheduled",
  MEETING_SCHEDULED: "Meeting scheduled",
  PROPOSAL_UPLOADED: "Proposal uploaded",
  PROJECT_CREATED: "Converted to project",
  PAYMENT_RECEIVED: "Payment received",
  COMMISSION_GENERATED: "Commission generated",
};

function SalesLeadTimeline({ activities }: { activities: (SalesLeadActivity & { performedBy: TeamMember | null })[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {activities.map((activity) => (
              <li key={activity.id} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="bg-primary size-1.5 shrink-0 rounded-full" aria-hidden="true" />
                  <span className="text-foreground text-sm font-medium">{ACTIVITY_LABEL[activity.type] ?? activity.type}</span>
                </div>
                {activity.description && <p className="text-muted-foreground pl-3.5 text-sm">{activity.description}</p>}
                <span className="text-muted-foreground pl-3.5 text-xs">
                  {activity.performedBy?.name ?? "System"} · {formatDateTime(activity.createdAt)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesLeadTimeline };
