import "server-only";

import { prisma } from "@/lib/prisma";
import { BUSINESS_DATA_SOURCE_LABEL } from "../lib/labels";

export interface ChartPoint {
  label: string;
  value: number;
}

/** Business count by discovery source - the "Discovery Sources" chart. */
export async function getDiscoverySourcesChart(): Promise<ChartPoint[]> {
  const rows = await prisma.business.groupBy({ by: ["dataSource"], _count: { dataSource: true } });
  return rows
    .map((row) => ({ label: BUSINESS_DATA_SOURCE_LABEL[row.dataSource], value: row._count.dataSource }))
    .sort((a, b) => b.value - a.value);
}

/** Latest report per business, bucketed into Low/Medium/High - the "Opportunity Score Distribution" chart. */
export async function getOpportunityScoreDistributionChart(): Promise<ChartPoint[]> {
  const reports = await prisma.aILeadReport.findMany({
    orderBy: { createdAt: "desc" },
    select: { businessId: true, opportunityScore: true },
  });

  const latestPerBusiness = new Map<string, number>();
  for (const report of reports) {
    if (!latestPerBusiness.has(report.businessId)) latestPerBusiness.set(report.businessId, report.opportunityScore);
  }

  let low = 0;
  let medium = 0;
  let high = 0;
  for (const score of latestPerBusiness.values()) {
    if (score >= 75) high++;
    else if (score >= 45) medium++;
    else low++;
  }

  return [
    { label: "Low (0-44)", value: low },
    { label: "Medium (45-74)", value: medium },
    { label: "High (75-100)", value: high },
  ];
}

/** New businesses discovered per month, oldest to newest - the "Monthly Discoveries" chart. */
export async function getMonthlyDiscoveriesChart(months = 6): Promise<ChartPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);

  const businesses = await prisma.business.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const business of businesses) {
    const key = `${business.createdAt.getFullYear()}-${business.createdAt.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.keys()).map((key) => {
    const [year, month] = key.split("-").map(Number);
    return { label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(year, month, 1)), value: buckets.get(key) ?? 0 };
  });
}
