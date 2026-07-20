import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface OfferingPaginationProps {
  page: number;
  totalPages: number;
  /** Current filters, so page links carry them forward instead of resetting the search. */
  searchParams: Record<string, string | undefined>;
  /** /offerings, or /offerings/[categorySlug] when browsing a single category. */
  basePath: string;
}

function buildPageHref(
  page: number,
  searchParams: Record<string, string | undefined>,
  basePath: string
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

/** Generic version of src/components/sections/training-pagination.tsx - real, shareable URLs, not client-side state. Omits itself when there's only one page. */
function OfferingPagination({ page, totalPages, searchParams, basePath }: OfferingPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Offering list pagination" className="flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" asChild>
        <Link
          href={buildPageHref(page - 1, searchParams, basePath)}
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
          href={buildPageHref(page + 1, searchParams, basePath)}
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

export { OfferingPagination };
