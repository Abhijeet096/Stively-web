import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

import type { BusinessFiltersInput } from "../validation/business-schemas";

export const BUSINESS_PAGE_SIZE = 20;

const businessListInclude = {
  aiReports: { orderBy: { createdAt: "desc" as const }, take: 1 },
  websiteAnalyses: { orderBy: { completedAt: "desc" as const }, take: 1 },
} satisfies Prisma.BusinessInclude;

export type BusinessListRow = Prisma.BusinessGetPayload<{ include: typeof businessListInclude }>;

export interface PaginatedBusinesses {
  businesses: BusinessListRow[];
  totalCount: number;
  totalPages: number;
  page: number;
}

export async function getBusinesses(filters: BusinessFiltersInput): Promise<PaginatedBusinesses> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;

  const where: Prisma.BusinessWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.dataSource ? { dataSource: filters.dataSource } : {}),
    ...(filters.industry ? { industry: { contains: filters.industry, mode: "insensitive" as const } } : {}),
    ...(filters.minScore != null ? { aiReports: { some: { opportunityScore: { gte: filters.minScore } } } } : {}),
    ...(filters.q
      ? {
          OR: [
            { businessName: { contains: filters.q, mode: "insensitive" as const } },
            { website: { contains: filters.q, mode: "insensitive" as const } },
            { city: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [businesses, totalCount] = await Promise.all([
    prisma.business.findMany({
      where,
      include: businessListInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * BUSINESS_PAGE_SIZE,
      take: BUSINESS_PAGE_SIZE,
    }),
    prisma.business.count({ where }),
  ]);

  return { businesses, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / BUSINESS_PAGE_SIZE)), page };
}

const businessDetailInclude = {
  websiteAnalyses: { orderBy: { startedAt: "desc" as const } },
  aiReports: { orderBy: { createdAt: "desc" as const } },
  socialProfiles: true,
  activities: { orderBy: { createdAt: "desc" as const }, include: { performedBy: true } },
  promotedSalesLead: { select: { id: true, sequence: true, assignedTo: { select: { name: true } } } },
  createdBy: { select: { name: true } },
} satisfies Prisma.BusinessInclude;

export type BusinessDetail = Prisma.BusinessGetPayload<{ include: typeof businessDetailInclude }>;

export async function getBusinessById(id: string): Promise<BusinessDetail | null> {
  return prisma.business.findUnique({ where: { id }, include: businessDetailInclude });
}

export interface LeadIntelligenceDashboardStats {
  totalBusinesses: number;
  newThisWeek: number;
  hotLeads: number; // latest report opportunityScore >= 75
  promoted: number;
  avgOpportunityScore: number | null;
}

export async function getLeadIntelligenceDashboardStats(): Promise<LeadIntelligenceDashboardStats> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [totalBusinesses, newThisWeek, promoted, hotLeads, scoreAgg] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.business.count({ where: { status: "PROMOTED" } }),
    prisma.business.count({ where: { aiReports: { some: { opportunityScore: { gte: 75 } } } } }),
    prisma.aILeadReport.aggregate({ _avg: { opportunityScore: true } }),
  ]);

  return {
    totalBusinesses,
    newThisWeek,
    hotLeads,
    promoted,
    avgOpportunityScore: scoreAgg._avg.opportunityScore != null ? Math.round(scoreAgg._avg.opportunityScore) : null,
  };
}

const searchRunInclude = {
  triggeredBy: { select: { name: true } },
} satisfies Prisma.LeadIntelligenceSearchRunInclude;

export type SearchRunRow = Prisma.LeadIntelligenceSearchRunGetPayload<{ include: typeof searchRunInclude }>;

export async function getRecentSearchRuns(take = 50): Promise<SearchRunRow[]> {
  return prisma.leadIntelligenceSearchRun.findMany({
    include: searchRunInclude,
    orderBy: { startedAt: "desc" },
    take,
  });
}

export async function getDistinctIndustries(): Promise<string[]> {
  const rows = await prisma.business.findMany({
    where: { industry: { not: null } },
    select: { industry: true },
    distinct: ["industry"],
    orderBy: { industry: "asc" },
    take: 100,
  });
  return rows.map((r) => r.industry!).filter(Boolean);
}
