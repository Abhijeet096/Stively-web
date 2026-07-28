import { SearchX } from "lucide-react";
import type { Offering } from "@prisma/client";

import { EmptyState } from "@/components/sections/empty-state";
import { OfferingCard } from "./offering-card";

export interface OfferingGridProps {
  offerings: Offering[];
  hasActiveFilters?: boolean;
  clearFiltersHref?: string;
  hrefBase?: string;
}

function OfferingGrid({ offerings, hasActiveFilters, clearFiltersHref, hrefBase }: OfferingGridProps) {
  if (offerings.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={hasActiveFilters ? "No offerings match these filters" : "No offerings published yet"}
        description={
          hasActiveFilters
            ? "Try adjusting or clearing your filters to see more offerings."
            : "Check back soon - we're adding to the catalog regularly."
        }
        {...(hasActiveFilters && clearFiltersHref
          ? { actionLabel: "Clear filters", actionHref: clearFiltersHref }
          : {})}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {offerings.map((offering) => (
        <OfferingCard key={offering.id} offering={offering} hrefBase={hrefBase} />
      ))}
    </div>
  );
}

export { OfferingGrid };
