import { Check, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { REQUEST_TIMELINE_STAGES, REQUEST_STATUS_LABEL } from "../lib/status-labels";
import { RequestStatusBadge } from "./request-status-badge";
import type { OfferingRequestWithDetail } from "../server/queries";

/**
 * The "Status Timeline" - a linear rail through REQUEST_TIMELINE_STAGES,
 * each stage marked done/current/upcoming by cross-referencing the real
 * OfferingRequestHistory events (not a fabricated progress bar). Rejected/
 * Cancelled requests are off that happy path entirely, so they render as a
 * distinct terminal notice above the rail instead of pretending it
 * continues past where it actually stopped.
 */
function RequestTimeline({ request }: { request: OfferingRequestWithDetail }) {
  const isOffPath = request.status === "REJECTED" || request.status === "CANCELLED";
  const currentStageIndex = REQUEST_TIMELINE_STAGES.indexOf(request.status);

  return (
    <div className="flex flex-col gap-6">
      {isOffPath && (
        <div className="border-destructive/30 bg-destructive/5 flex items-center gap-3 rounded-lg border p-4">
          <RequestStatusBadge status={request.status} />
          <span className="text-muted-foreground text-sm">
            This request was {REQUEST_STATUS_LABEL[request.status].toLowerCase()}
            {request.status === "REJECTED" && request.history.find((h) => h.toStatus === "REJECTED")?.description
              ? `: ${request.history.find((h) => h.toStatus === "REJECTED")?.description}`
              : "."}
          </span>
        </div>
      )}

      <ol className="flex flex-col gap-0">
        {REQUEST_TIMELINE_STAGES.map((stage, index) => {
          const event = request.history.find((h) => h.toStatus === stage);
          const isDone = !isOffPath && (!!event || (stage === "SUBMITTED" && !!request.submittedAt));
          const isCurrent = !isOffPath && currentStageIndex === index;
          const isLast = index === REQUEST_TIMELINE_STAGES.length - 1;
          const timestamp = event?.createdAt ?? (stage === "SUBMITTED" ? request.submittedAt : undefined);

          return (
            <li key={stage} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    isDone && "bg-primary text-primary-foreground",
                    isCurrent && !isDone && "border-primary text-primary border-2",
                    !isDone && !isCurrent && "border-border text-muted-foreground border-2"
                  )}
                >
                  {isDone ? <Check className="size-3.5" aria-hidden="true" /> : <Clock className="size-3.5" aria-hidden="true" />}
                </div>
                {!isLast && (
                  <div aria-hidden="true" className={cn("w-0.5 flex-1", isDone ? "bg-primary" : "bg-border")} style={{ minHeight: 32 }} />
                )}
              </div>
              <div className="flex flex-col gap-0.5 pb-8">
                <span className={cn("text-sm font-medium", isDone || isCurrent ? "text-foreground" : "text-muted-foreground")}>
                  {REQUEST_STATUS_LABEL[stage]}
                </span>
                {timestamp && (
                  <span className="text-muted-foreground text-xs">
                    {timestamp.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export { RequestTimeline };
