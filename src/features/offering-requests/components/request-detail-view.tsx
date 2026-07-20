import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";

import { EmptyState } from "@/components/sections/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { formatRequestNumber } from "../lib/request-number";
import { REQUEST_TYPE_LABEL } from "../lib/status-labels";
import { RequestStatusBadge } from "./request-status-badge";
import { RequestTimeline } from "./request-timeline";
import type { OfferingRequestWithDetail } from "../server/queries";

/** The full request detail page body - number, timeline, offering summary, and honest placeholders for the two surfaces that don't exist yet (messaging, staff assignment), same anti-fabrication discipline as Phase 4's Testimonials placeholder. */
function RequestDetailView({ request }: { request: OfferingRequestWithDetail }) {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground font-mono text-sm">{formatRequestNumber(request.sequence)}</span>
          <RequestStatusBadge status={request.status} />
          <span className="text-muted-foreground text-sm">{REQUEST_TYPE_LABEL[request.requestType]} request</span>
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">{request.offering.title}</h2>
        <p className="text-muted-foreground text-sm">
          {request.submittedAt
            ? `Submitted ${request.submittedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
            : "Not submitted yet"}
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h3 className="font-display text-lg font-semibold">Status</h3>
        <RequestTimeline request={request} />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-display text-lg font-semibold">Offering</h3>
        <Link href={`/offerings/${request.offering.slug}`} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Card variant="interactive">
            <CardContent className="flex flex-col gap-1">
              <span className="text-foreground font-medium">{request.offering.title}</span>
              <span className="text-muted-foreground text-sm">{request.offering.shortDescription}</span>
            </CardContent>
          </Card>
        </Link>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">Messages</h3>
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Once your assigned team reaches out, messages will appear here."
          />
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">Assigned team</h3>
          <EmptyState
            icon={Users}
            title="Not assigned yet"
            description="A counsellor or team member will be assigned to your request soon."
          />
        </section>
      </div>
    </div>
  );
}

export { RequestDetailView };
