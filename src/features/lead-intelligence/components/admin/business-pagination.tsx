import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface BusinessPaginationProps {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

function buildPageHref(page: number, searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/lead-intelligence/businesses?${params.toString()}`;
}

function BusinessPagination({ page, totalPages, searchParams }: BusinessPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Businesses pagination" className="flex items-center justify-center gap-3">
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

export { BusinessPagination };
