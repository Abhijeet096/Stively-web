import {
  getLeads,
  isValidLeadType,
  isValidLeadStatus,
  isValidLeadSource,
} from "@/lib/queries/leads";
import { getAllTeamMembers } from "@/lib/queries/team-members";
import type { LeadType } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { LeadsFilters } from "@/components/dashboard/leads-filters";
import { LeadsPagination } from "@/components/dashboard/leads-pagination";

export interface LeadListSearchParams {
  [key: string]: string | undefined;
  q?: string;
  leadType?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  page?: string;
}

export interface LeadTypeListPageProps {
  title: string;
  basePath: string;
  /** When set, this page only ever shows one lead type (Students/Businesses) and hides the lead-type filter, since there's nothing to filter. */
  forcedLeadType?: LeadType;
  searchParams: LeadListSearchParams;
}

/**
 * Shared body for /dashboard/leads, /dashboard/students, and
 * /dashboard/businesses - three routes, one implementation. The latter
 * two are thin wrappers around this with `forcedLeadType` set, per this
 * task's "Do not duplicate UI" instruction - they're views into the same
 * lead data, not a separate feature.
 */
export async function LeadTypeListPage({
  title,
  basePath,
  forcedLeadType,
  searchParams,
}: LeadTypeListPageProps) {
  const page = searchParams.page ? Number(searchParams.page) : 1;

  const [{ leads, totalPages }, owners] = await Promise.all([
    getLeads({
      search: searchParams.q,
      leadType:
        forcedLeadType ??
        (isValidLeadType(searchParams.leadType) ? searchParams.leadType : undefined),
      status: isValidLeadStatus(searchParams.status) ? searchParams.status : undefined,
      source: isValidLeadSource(searchParams.source) ? searchParams.source : undefined,
      ownerId: searchParams.ownerId,
      page: Number.isFinite(page) && page > 0 ? page : 1,
    }),
    getAllTeamMembers(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h1>

      <LeadsFilters
        search={searchParams.q}
        leadType={searchParams.leadType}
        status={searchParams.status}
        source={searchParams.source}
        ownerId={searchParams.ownerId}
        owners={owners}
        action={basePath}
        hideLeadType={!!forcedLeadType}
      />

      <Card>
        <CardContent>
          <LeadsTable leads={leads} />
        </CardContent>
      </Card>

      <LeadsPagination
        page={page}
        totalPages={totalPages}
        searchParams={searchParams}
        basePath={basePath}
      />
    </div>
  );
}
