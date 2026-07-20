import type { Offering, OfferingCategory } from "@prisma/client";

import { Container } from "@/components/shared/container";
import { OfferingToolbar } from "./offering-toolbar";
import { OfferingGrid } from "./offering-grid";
import { OfferingPagination } from "./offering-pagination";
import { CategoryNav } from "./category-nav";

export interface OfferingCatalogProps {
  offerings: Offering[];
  totalCount: number;
  totalPages: number;
  page: number;
  searchParams: Record<string, string | undefined>;
  basePath: string;
  hasActiveFilters: boolean;
  activeCategory?: OfferingCategory;
}

/**
 * The catalog body (category pills, toolbar, grid, pagination) - shared by
 * the main /offerings listing and /offerings/[categorySlug]'s archive view
 * (see src/app/(marketing)/offerings/[slug]/page.tsx), so there's exactly
 * one place this markup exists instead of two near-identical copies.
 */
function OfferingCatalog({
  offerings,
  totalCount,
  totalPages,
  page,
  searchParams,
  basePath,
  hasActiveFilters,
  activeCategory,
}: OfferingCatalogProps) {
  return (
    <Container className="flex flex-col gap-10">
      <CategoryNav activeCategory={activeCategory} />
      <OfferingToolbar />

      {/* Announces result count to screen readers on every filter/page change */}
      <p aria-live="polite" className="sr-only">
        {totalCount} offering{totalCount === 1 ? "" : "s"} found
      </p>

      <OfferingGrid offerings={offerings} hasActiveFilters={hasActiveFilters} clearFiltersHref={basePath} />

      <OfferingPagination page={page} totalPages={totalPages} searchParams={searchParams} basePath={basePath} />
    </Container>
  );
}

export { OfferingCatalog };
