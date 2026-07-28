import Link from "next/link";
import { ArrowLeft, FolderKanban } from "lucide-react";
import type { TeamMember, OfferingEnrollment } from "@prisma/client";

import { formatPrice } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/sections/empty-state";
import { EnrollmentOpsCard } from "@/features/enrollments/components/enrollment-ops-card";
import { MentorOpsCard } from "@/features/mentors/components/admin/mentor-ops-card";
import { QuoteReviewCard } from "@/features/offering-requests/components/admin/quote-review-card";
import { STUDENT_STEPS, BUSINESS_STEPS } from "@/features/offering-requests/lib/steps-config";
import { CONTACT_METHOD_LABEL } from "@/features/offering-requests/lib/status-labels";
import type { getMentorForOperationsCard } from "@/features/mentors/server/queries";
import { formatOperationNumber } from "../lib/operation-number";
import { OperationStatusBadge } from "./operation-status-badge";
import { OperationPriorityBadge } from "./operation-priority-badge";
import { StatusChanger } from "./status-changer";
import { OperationMetaPanel } from "./operation-meta-panel";
import { AssignmentPanel } from "./assignment-panel";
import { ActivityTimeline } from "./activity-timeline";
import { InternalNotesPanel } from "./internal-notes-panel";
import { MeetingList } from "./meeting-list";
import type { OperationItemDetail } from "../server/queries";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

const WIZARD_FIELD_BY_NAME = new Map(
  [...STUDENT_STEPS, ...BUSINESS_STEPS].flatMap((step) => step.fields).map((field) => [field.name, field])
);

/** Renders a raw `details` Json value using the same label/option config the wizard itself used to collect it - "1-10" becomes "1-10 employees", not a raw code. */
function formatWizardValue(fieldName: string, value: unknown): string {
  if (typeof value !== "string" || !value) return "-";
  const field = WIZARD_FIELD_BY_NAME.get(fieldName);
  const option = field?.options?.find((o) => o.value === value);
  return option?.label ?? value;
}

/** The full wizard submission, unfiltered - every field the client actually filled in, admin never had a way to see before this. */
function RequestDetailsCard({
  requestType,
  details,
  preferredContactMethod,
  preferredMeetingTime,
}: {
  requestType: "STUDENT" | "BUSINESS";
  details: unknown;
  preferredContactMethod: string | null;
  preferredMeetingTime: string | null;
}) {
  const steps = requestType === "BUSINESS" ? BUSINESS_STEPS : STUDENT_STEPS;
  const record = details && typeof details === "object" ? (details as Record<string, unknown>) : {};
  const rows = steps
    .flatMap((step) => step.fields)
    .filter((field) => field.name in record)
    .map((field) => ({ label: field.label, value: formatWizardValue(field.name, record[field.name]) }));

  if (rows.length === 0 && !preferredContactMethod && !preferredMeetingTime) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">{label}</dt>
              <dd className="text-foreground text-sm">{value}</dd>
            </div>
          ))}
          {preferredContactMethod && (
            <div>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">Preferred contact method</dt>
              <dd className="text-foreground text-sm">{CONTACT_METHOD_LABEL[preferredContactMethod as keyof typeof CONTACT_METHOD_LABEL] ?? preferredContactMethod}</dd>
            </div>
          )}
          {preferredMeetingTime && (
            <div>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">Preferred time</dt>
              <dd className="text-foreground text-sm">{preferredMeetingTime}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

/**
 * The full Operations detail screen - customer/offering/source summary,
 * status changer, activity timeline, internal notes, assignment, meetings.
 * Payment info is shown for ORDER-type items from the real Order record
 * (amount/status/paidAt); a Payment/Enrollment/Project placeholder only
 * appears where genuinely nothing exists yet (no Payments/Enrollment/
 * Project model for a REQUEST-type item - see the schema's OperationItem
 * comment on what's deliberately not built this phase).
 */
function OperationDetailView({
  item,
  teamMembers,
  enrollment,
  mentorAssignments,
}: {
  item: OperationItemDetail;
  teamMembers: TeamMember[];
  enrollment: OfferingEnrollment | null;
  mentorAssignments: Awaited<ReturnType<typeof getMentorForOperationsCard>>;
}) {
  const source = item.type === "REQUEST" ? item.request : item.order;
  if (!source) {
    return <EmptyState icon={FolderKanban} title="Source record missing" description="This item's underlying request or order could not be found." />;
  }

  const customerName = source.user.name ?? "—";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/operations" aria-label="Back to Operations">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <span className="text-muted-foreground font-mono text-sm">{formatOperationNumber(item.sequence)}</span>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{customerName}</h1>
        <OperationStatusBadge item={item} />
        <OperationPriorityBadge priority={item.priority} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer &amp; offering</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs tracking-wide uppercase">Email</dt>
                  <dd className="text-foreground text-sm">{source.user.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs tracking-wide uppercase">Offering</dt>
                  <dd className="text-foreground text-sm">
                    <Link href={`/offerings/${source.offering.slug}`} className="hover:underline">
                      {source.offering.title}
                    </Link>
                  </dd>
                </div>

                {item.type === "REQUEST" && item.request && (
                  <>
                    <div>
                      <dt className="text-muted-foreground text-xs tracking-wide uppercase">Request type</dt>
                      <dd className="text-foreground text-sm">{item.request.requestType}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs tracking-wide uppercase">Submitted</dt>
                      <dd className="text-foreground text-sm">
                        {item.request.submittedAt ? formatDate(item.request.submittedAt) : "—"}
                      </dd>
                    </div>
                  </>
                )}

                {item.type === "ORDER" && item.order && (
                  <>
                    <div>
                      <dt className="text-muted-foreground text-xs tracking-wide uppercase">Amount</dt>
                      <dd className="text-foreground text-sm">
                        {item.order.amount === 0 ? "Free" : formatPrice(item.order.amount, item.order.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs tracking-wide uppercase">Paid on</dt>
                      <dd className="text-foreground text-sm">
                        {item.order.paidAt ? formatDate(item.order.paidAt) : "—"}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          {item.type === "REQUEST" && item.request && (
            <RequestDetailsCard
              requestType={item.request.requestType}
              details={item.request.details}
              preferredContactMethod={item.request.preferredContactMethod}
              preferredMeetingTime={item.request.preferredMeetingTime}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusChanger
                operationItemId={item.id}
                type={item.type}
                requestType={item.request?.requestType}
                currentStatus={item.type === "REQUEST" ? (item.request?.status ?? "SUBMITTED") : (item.order?.status ?? "PENDING")}
              />
            </CardContent>
          </Card>

          {item.type === "REQUEST" && item.request && <QuoteReviewCard request={item.request} />}

          <ActivityTimeline activities={item.activities} />

          <MeetingList operationItemId={item.id} meetings={item.meetings} />

          <EnrollmentOpsCard enrollment={enrollment} />

          <MentorOpsCard assignments={mentorAssignments} />
        </div>

        <div className="flex flex-col gap-6">
          <AssignmentPanel
            operationItemId={item.id}
            currentAssignee={item.assignedTo}
            teamMembers={teamMembers}
          />
          <OperationMetaPanel
            operationItemId={item.id}
            priority={item.priority}
            dueDate={item.dueDate}
            nextAction={item.nextAction}
          />
          <InternalNotesPanel operationItemId={item.id} comments={item.comments} />
        </div>
      </div>
    </div>
  );
}

export { OperationDetailView };
