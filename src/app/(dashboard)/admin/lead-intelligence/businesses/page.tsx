import type { Metadata } from "next";
import type { BusinessStatus, BusinessDataSource } from "@prisma/client";

import { requireRole } from "@/lib/session";
import { getBusinesses, getDistinctIndustries } from "@/features/lead-intelligence/server/queries";
import { BusinessList } from "@/features/lead-intelligence/components/admin/business-list";
import { BusinessFiltersToolbar } from "@/features/lead-intelligence/components/admin/business-filters-toolbar";
import { BusinessPagination } from "@/features/lead-intelligence/components/admin/business-pagination";
import { LeadIntelligenceSubnav } from "@/features/lead-intelligence/components/admin/lead-intelligence-subnav";

interface BusinessesPageProps {
  searchParams: Promise<{
    status?: string;
    dataSource?: string;
    industry?: string;
    minScore?: string;
    q?: string;
    page?: string;
  }>;
}

export const metadata: Metadata = { title: "Businesses" };

export default async function BusinessesPage({ searchParams }: BusinessesPageProps) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const params = await searchParams;

  const filters = {
    status: params.status as BusinessStatus | undefined,
    dataSource: params.dataSource as BusinessDataSource | undefined,
    industry: params.industry,
    minScore: params.minScore ? Number(params.minScore) : undefined,
    q: params.q,
    page: params.page ? Number(params.page) : undefined,
  };

  const [{ businesses, totalCount, totalPages, page }, industries] = await Promise.all([getBusinesses(filters), getDistinctIndustries()]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <LeadIntelligenceSubnav active="Businesses" />

      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Businesses</h1>
        <p className="text-muted-foreground text-sm">
          {totalCount} business{totalCount === 1 ? "" : "es"} discovered.
        </p>
      </div>

      <BusinessFiltersToolbar industries={industries} />

      <BusinessList businesses={businesses} selectable />

      <BusinessPagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
