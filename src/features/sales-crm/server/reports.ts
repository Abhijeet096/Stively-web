import "server-only";

import { prisma } from "@/lib/prisma";
import { LOST_REASON_LABEL } from "../lib/lost-reason-labels";
import type { SalesCrmViewer } from "./rbac";

function leadWhere(viewer: SalesCrmViewer) {
  return viewer.hasFullAccess ? {} : { assignedToId: viewer.teamMemberId ?? undefined };
}

export interface LeaderboardRow {
  teamMemberId: string;
  name: string;
  wonLeads: number;
  totalRevenue: number;
  totalCommission: number;
}

/** Ranked by revenue collected - the "Sales Leaderboard" report. Always company-wide regardless of viewer, since ranking only makes sense against the whole team. */
export async function getSalesLeaderboard(): Promise<LeaderboardRow[]> {
  const salespeople = await prisma.teamMember.findMany({
    where: { role: { in: ["SALESPERSON", "SALES_MANAGER"] } },
    select: {
      id: true,
      name: true,
      ownedSalesLeads: { where: { status: "WON" }, select: { id: true } },
      salesProjectsAsSales: { select: { payments: { where: { status: "PAID" }, select: { amount: true } } } },
      commissionsEarned: { select: { commissionAmount: true } },
    },
  });

  return salespeople
    .map((member) => ({
      teamMemberId: member.id,
      name: member.name,
      wonLeads: member.ownedSalesLeads.length,
      totalRevenue: member.salesProjectsAsSales.reduce((sum, p) => sum + p.payments.reduce((s, pay) => s + pay.amount, 0), 0),
      totalCommission: member.commissionsEarned.reduce((sum, c) => sum + c.commissionAmount, 0),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export interface ConversionRateReport {
  totalLeads: number;
  won: number;
  lost: number;
  open: number;
  conversionRate: number;
}

/** Won / total, plus the raw counts behind it - the "Conversion Rate" report. */
export async function getConversionRateReport(viewer: SalesCrmViewer): Promise<ConversionRateReport> {
  const where = leadWhere(viewer);
  const [totalLeads, won, lost] = await Promise.all([
    prisma.salesLead.count({ where }),
    prisma.salesLead.count({ where: { ...where, status: "WON" } }),
    prisma.salesLead.count({ where: { ...where, status: "LOST" } }),
  ]);

  return {
    totalLeads,
    won,
    lost,
    open: totalLeads - won - lost,
    conversionRate: totalLeads > 0 ? Math.round((won / totalLeads) * 1000) / 10 : 0,
  };
}

export interface RevenueBySalesPersonRow {
  teamMemberId: string;
  name: string;
  revenue: number;
}

/** Revenue actually collected, grouped by salesperson - the "Revenue by Sales Person" report. */
export async function getRevenueBySalesPerson(): Promise<RevenueBySalesPersonRow[]> {
  const projects = await prisma.salesProject.findMany({
    where: { salesPersonId: { not: null } },
    select: {
      salesPersonId: true,
      salesPerson: { select: { name: true } },
      payments: { where: { status: "PAID" }, select: { amount: true } },
    },
  });

  const byPerson = new Map<string, RevenueBySalesPersonRow>();
  for (const project of projects) {
    if (!project.salesPersonId || !project.salesPerson) continue;
    const revenue = project.payments.reduce((sum, p) => sum + p.amount, 0);
    const existing = byPerson.get(project.salesPersonId);
    if (existing) {
      existing.revenue += revenue;
    } else {
      byPerson.set(project.salesPersonId, { teamMemberId: project.salesPersonId, name: project.salesPerson.name, revenue });
    }
  }

  return Array.from(byPerson.values()).sort((a, b) => b.revenue - a.revenue);
}

export interface CommissionReportRow {
  teamMemberId: string;
  name: string;
  pending: number;
  approved: number;
  paid: number;
  total: number;
}

/** Commission broken down by status, per salesperson - the "Commission Report". */
export async function getCommissionReport(): Promise<CommissionReportRow[]> {
  const commissions = await prisma.salesCommission.findMany({
    select: { salesPersonId: true, salesPerson: { select: { name: true } }, status: true, commissionAmount: true },
  });

  const byPerson = new Map<string, CommissionReportRow>();
  for (const c of commissions) {
    const existing = byPerson.get(c.salesPersonId) ?? {
      teamMemberId: c.salesPersonId,
      name: c.salesPerson.name,
      pending: 0,
      approved: 0,
      paid: 0,
      total: 0,
    };
    if (c.status === "PENDING") existing.pending += c.commissionAmount;
    if (c.status === "APPROVED") existing.approved += c.commissionAmount;
    if (c.status === "PAID") existing.paid += c.commissionAmount;
    existing.total += c.commissionAmount;
    byPerson.set(c.salesPersonId, existing);
  }

  return Array.from(byPerson.values()).sort((a, b) => b.total - a.total);
}

export interface LeadSourceReportRow {
  source: string;
  total: number;
  won: number;
  conversionRate: number;
}

/** Volume and win rate per source - the "Lead Source Report". */
export async function getLeadSourceReport(viewer: SalesCrmViewer): Promise<LeadSourceReportRow[]> {
  const where = leadWhere(viewer);
  const [totals, wonBySource] = await Promise.all([
    prisma.salesLead.groupBy({ by: ["source"], where, _count: { source: true } }),
    prisma.salesLead.groupBy({ by: ["source"], where: { ...where, status: "WON" }, _count: { source: true } }),
  ]);
  const wonMap = new Map(wonBySource.map((row) => [row.source, row._count.source]));

  return totals
    .map((row) => {
      const won = wonMap.get(row.source) ?? 0;
      return {
        source: row.source,
        total: row._count.source,
        won,
        conversionRate: row._count.source > 0 ? Math.round((won / row._count.source) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export interface LostLeadAnalysisRow {
  reason: string;
  count: number;
}

/** How many lost leads fall under each reason, most common first - the "Lost Lead Analysis" report. Leads lost before a reason was recorded show as "Not specified". */
export async function getLostLeadAnalysis(viewer: SalesCrmViewer): Promise<LostLeadAnalysisRow[]> {
  const lost = await prisma.salesLead.findMany({
    where: { ...leadWhere(viewer), status: "LOST" },
    select: { lostReason: true },
  });

  const counts = new Map<string, number>();
  for (const { lostReason } of lost) {
    const key = lostReason ?? "NOT_SPECIFIED";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([key, count]) => ({ reason: key === "NOT_SPECIFIED" ? "Not specified" : LOST_REASON_LABEL[key as keyof typeof LOST_REASON_LABEL], count }))
    .sort((a, b) => b.count - a.count);
}
