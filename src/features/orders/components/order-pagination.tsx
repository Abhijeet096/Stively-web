import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface OrderPaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
}

/** Simpler than request-pagination.tsx - "My Orders" has no filters to preserve across pages, just a page number. */
function OrderPagination({ page, totalPages, basePath }: OrderPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Order list pagination" className="flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" asChild>
        <Link
          href={`${basePath}?page=${page - 1}`}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
        >
          Previous
        </Link>
      </Button>
      <span className="text-muted-foreground text-sm">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" size="sm" asChild>
        <Link
          href={`${basePath}?page=${page + 1}`}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : undefined}
          className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
        >
          Next
        </Link>
      </Button>
    </nav>
  );
}

export { OrderPagination };
