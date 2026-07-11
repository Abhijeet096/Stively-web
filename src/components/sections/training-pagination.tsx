import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface TrainingPaginationProps {
  page: number;
  totalPages: number;
  /** Current filters, so page links carry them forward instead of resetting the search. */
  searchParams: Record<string, string | undefined>;
}

function buildPageHref(page: number, searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `/training?${params.toString()}`;
}

/**
 * Plain <Link>s, not client-side state - each one is a real, shareable,
 * bookmarkable URL. Omits itself entirely when there's only one page,
 * rather than rendering disabled controls with nothing to do.
 */
function TrainingPagination({ page, totalPages, searchParams }: TrainingPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Program list pagination" className="flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" asChild>
        <Link
          href={buildPageHref(page - 1, searchParams)}
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
          href={buildPageHref(page + 1, searchParams)}
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

export { TrainingPagination };
