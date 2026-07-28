import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { getMyRequests } from "@/features/offering-requests/server/queries";
import { parseRequestFilters } from "@/features/offering-requests/validation/request-filters";
import { RequestFiltersToolbar } from "@/features/offering-requests/components/request-filters-toolbar";
import { RequestList } from "@/features/offering-requests/components/request-list";
import { RequestPagination } from "@/features/offering-requests/components/request-pagination";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "My Service Requests" };

interface ClientRequestsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ClientRequestsPage({ searchParams }: ClientRequestsPageProps) {
  const user = await requireRole("CLIENT");
  const params = await searchParams;
  const filters = parseRequestFilters(params);

  const { requests, totalCount, totalPages, page } = await getMyRequests(user.id, "BUSINESS", filters);
  const hasActiveFilters = !!(filters.q || filters.status || filters.since);

  return (
    <>
      <SetPageTitle title="My Service Requests" />
      <Container className="flex flex-col gap-8 py-8">
        <SectionHeader
          title="My Service Requests"
          description="Every proposal request you've started, submitted, or that's in progress."
        />

        <RequestFiltersToolbar />

        <p aria-live="polite" className="sr-only">
          {totalCount} request{totalCount === 1 ? "" : "s"} found
        </p>

        <RequestList
          requests={requests}
          hrefFor={(r) => (r.status === "DRAFT" ? `/request-proposal/${r.offering.slug}` : `/client/requests/${r.id}`)}
          hasActiveFilters={hasActiveFilters}
          clearFiltersHref="/client/requests"
          emptyStateHref="/client/offerings"
          emptyStateLabel="Browse offerings"
        />

        <RequestPagination page={page} totalPages={totalPages} searchParams={params} basePath="/client/requests" />
      </Container>
    </>
  );
}
