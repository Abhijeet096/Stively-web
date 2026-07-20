import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface LeadsPaginationProps {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  basePath: string;
}

function buildPageHref(
  basePath: string,
  page: number,
  searchParams: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

/**
 * Same plain-<Link> pattern as
 * src/components/sections/training-pagination.tsx, generalized with a
 * `basePath` prop since /dashboard/leads, /dashboard/students, and
 * /dashboard/businesses all reuse this rather than each getting their own
 * copy.
 */
function LeadsPagination({ page, totalPages, searchParams, basePath }: LeadsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Lead list pagination" className="flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" asChild>
        <Link
          href={buildPageHref(basePath, page - 1, searchParams)}
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
          href={buildPageHref(basePath, page + 1, searchParams)}
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

export { LeadsPagination };
