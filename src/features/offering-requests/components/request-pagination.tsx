import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface RequestPaginationProps {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  basePath: string;
}

function buildPageHref(page: number, searchParams: Record<string, string | undefined>, basePath: string) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

/** Same real-URL pagination pattern as every other list page in this codebase (training-pagination.tsx, offering-pagination.tsx) - kept feature-local rather than a cross-feature import, per this app's existing precedent of each feature owning its own copy. */
function RequestPagination({ page, totalPages, searchParams, basePath }: RequestPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Request list pagination" className="flex items-center justify-center gap-3">
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

export { RequestPagination };
