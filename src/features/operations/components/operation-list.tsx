import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/sections/empty-state";
import { OperationCard } from "./operation-card";
import type { OperationItemWithRelations } from "../server/queries";

function OperationList({ items, hasActiveFilters }: { items: OperationItemWithRelations[]; hasActiveFilters?: boolean }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={hasActiveFilters ? "No items match these filters" : "Nothing here yet"}
        description={
          hasActiveFilters
            ? "Try adjusting or clearing your filters."
            : "Submitted requests and paid orders will show up here."
        }
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <OperationCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export { OperationList };
