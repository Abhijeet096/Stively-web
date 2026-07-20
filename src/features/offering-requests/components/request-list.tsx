import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/sections/empty-state";
import { RequestCard } from "./request-card";
import type { OfferingRequestWithOffering } from "../server/queries";

export interface RequestListProps {
  requests: OfferingRequestWithOffering[];
  /** Builds each card's href from a request id - lets the caller point Drafts at /enroll or /request-proposal and everything else at the detail page. */
  hrefFor: (request: OfferingRequestWithOffering) => string;
  hasActiveFilters?: boolean;
  clearFiltersHref?: string;
  emptyStateHref: string;
  emptyStateLabel: string;
}

function RequestList({
  requests,
  hrefFor,
  hasActiveFilters,
  clearFiltersHref,
  emptyStateHref,
  emptyStateLabel,
}: RequestListProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={hasActiveFilters ? "No requests match these filters" : "No requests yet"}
        description={
          hasActiveFilters
            ? "Try adjusting or clearing your filters."
            : "Once you enroll in an offering or request a proposal, it'll show up here."
        }
        actionLabel={hasActiveFilters ? "Clear filters" : emptyStateLabel}
        actionHref={hasActiveFilters ? clearFiltersHref : emptyStateHref}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} href={hrefFor(request)} />
      ))}
    </div>
  );
}

export { RequestList };
