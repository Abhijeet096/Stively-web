import type { Metadata } from "next";

import {
  LeadTypeListPage,
  type LeadListSearchParams,
} from "@/components/dashboard/lead-type-list-page";

export const metadata: Metadata = { title: "Businesses" };

interface BusinessesPageProps {
  searchParams: Promise<LeadListSearchParams>;
}

/** Thin wrapper - same shared list page, forced to leadType BUSINESS. Not a separate feature. */
export default async function BusinessesPage({ searchParams }: BusinessesPageProps) {
  const params = await searchParams;
  return (
    <LeadTypeListPage
      title="Businesses"
      basePath="/admin/businesses"
      forcedLeadType="BUSINESS"
      searchParams={params}
    />
  );
}
