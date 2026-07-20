import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { formatRequestNumber } from "../lib/request-number";
import { STEPS_BY_TYPE } from "../lib/steps-config";
import { RequestStatusBadge } from "./request-status-badge";
import type { OfferingRequestWithOffering } from "../server/queries";

export interface RequestCardProps {
  request: OfferingRequestWithOffering;
  /** /student/requests/[id] resuming into /enroll/[slug] for a Draft, or the real detail page otherwise - the caller decides since it depends on role. */
  href: string;
}

function RequestCard({ request, href }: RequestCardProps) {
  const totalSteps = STEPS_BY_TYPE[request.requestType].length;

  return (
    <Link
      href={href}
      className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card variant="interactive" className="h-full">
        <CardHeader>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground font-mono text-xs">
              {formatRequestNumber(request.sequence)}
            </span>
            <RequestStatusBadge status={request.status} />
          </div>
          <CardTitle className="font-display">{request.offering.title}</CardTitle>
          <CardDescription>
            {request.status === "DRAFT"
              ? `Step ${Math.min(request.currentStep, totalSteps)} of ${totalSteps}`
              : `Submitted ${request.submittedAt?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) ?? "-"}`}
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-border/70 mt-auto justify-between border-t pt-4">
          <span className="text-muted-foreground text-sm">
            {request.status === "DRAFT" ? "Continue application" : "View details"}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export { RequestCard };
