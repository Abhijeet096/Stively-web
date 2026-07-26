import "server-only";

import { prisma } from "@/lib/prisma";
import { SALES_LEAD_SOURCE_LABEL } from "../lib/labels";
import type { SalesCrmViewer } from "./rbac";

export interface ChartPoint {
  label: string;
  value: number;
}

function leadWhere(viewer: SalesCrmViewer) {
  return viewer.hasFullAccess ? {} : { assignedToId: viewer.teamMemberId ?? undefined };
}

function projectWhere(viewer: SalesCrmViewer) {
  return viewer.hasFullAccess ? {} : { salesPersonId: viewer.teamMemberId ?? undefined };
}

/** Leads created per month, oldest to newest - the "Monthly Leads" chart. */
export async function getMonthlyLeadsChart(viewer: SalesCrmViewer, months = 6): Promise<ChartPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);

  const leads = await prisma.salesLead.findMany({
    where: { ...leadWhere(viewer), createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const lead of leads) {
    const key = `${lead.createdAt.getFullYear()}-${lead.createdAt.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.keys()).map((key) => {
    const [year, month] = key.split("-").map(Number);
    return {
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(year, month, 1)),
      value: buckets.get(key) ?? 0,
    };
  });
}

/** New -> Contacted -> Interested -> Proposal Sent -> Negotiation -> Won - the "Lead Conversion" funnel. */
export async function getLeadConversionChart(viewer: SalesCrmViewer): Promise<ChartPoint[]> {
  const where = leadWhere(viewer);
  const [total, contacted, interested, proposalSent, negotiation, won] = await Promise.all([
    prisma.salesLead.count({ where }),
    prisma.salesLead.count({ where: { ...where, status: { notIn: ["NEW"] } } }),
    prisma.salesLead.count({ where: { ...where, status: { in: ["INTERESTED", "MEETING_SCHEDULED", "PROPOSAL_SENT", "NEGOTIATION", "WON"] } } }),
    prisma.salesLead.count({ where: { ...where, status: { in: ["PROPOSAL_SENT", "NEGOTIATION", "WON"] } } }),
    prisma.salesLead.count({ where: { ...where, status: { in: ["NEGOTIATION", "WON"] } } }),
    prisma.salesLead.count({ where: { ...where, status: "WON" } }),
  ]);

  return [
    { label: "Total", value: total },
    { label: "Contacted", value: contacted },
    { label: "Interested", value: interested },
    { label: "Proposal", value: proposalSent },
    { label: "Negotiation", value: negotiation },
    { label: "Won", value: won },
  ];
}

/** Revenue actually received (PAID payments) per month, in rupees - the "Revenue" chart. */
export async function getRevenueChart(viewer: SalesCrmViewer, months = 6): Promise<ChartPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);

  const payments = await prisma.salesProjectPayment.findMany({
    where: { status: "PAID", paidAt: { gte: since }, ...(viewer.hasFullAccess ? {} : { salesProject: projectWhere(viewer) }) },
    select: { amount: true, paidAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const payment of payments) {
    if (!payment.paidAt) continue;
    const key = `${payment.paidAt.getFullYear()}-${payment.paidAt.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + payment.amount);
  }

  return Array.from(buckets.keys()).map((key) => {
    const [year, month] = key.split("-").map(Number);
    return {
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(year, month, 1)),
      value: Math.round((buckets.get(key) ?? 0) / 100),
    };
  });
}

/** Commission generated per month, in rupees - the "Commission" chart. */
export async function getCommissionChart(viewer: SalesCrmViewer, months = 6): Promise<ChartPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);

  const commissions = await prisma.salesCommission.findMany({
    where: { createdAt: { gte: since }, ...(viewer.hasFullAccess ? {} : { salesPersonId: viewer.teamMemberId ?? undefined }) },
    select: { commissionAmount: true, createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const commission of commissions) {
    const key = `${commission.createdAt.getFullYear()}-${commission.createdAt.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + commission.commissionAmount);
  }

  return Array.from(buckets.keys()).map((key) => {
    const [year, month] = key.split("-").map(Number);
    return {
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(year, month, 1)),
      value: Math.round((buckets.get(key) ?? 0) / 100),
    };
  });
}

/** Completed vs still-pending vs overdue follow-ups - the "Follow Up Performance" chart. */
export async function getFollowUpPerformanceChart(viewer: SalesCrmViewer): Promise<ChartPoint[]> {
  const now = new Date();
  const scopedId = viewer.hasFullAccess ? undefined : viewer.teamMemberId ?? undefined;
  const where = scopedId ? { assignedToId: scopedId } : {};

  const [completed, overdue, upcoming] = await Promise.all([
    prisma.salesFollowUp.count({ where: { ...where, status: "COMPLETED" } }),
    prisma.salesFollowUp.count({ where: { ...where, status: "PENDING", dueAt: { lt: now } } }),
    prisma.salesFollowUp.count({ where: { ...where, status: "PENDING", dueAt: { gte: now } } }),
  ]);

  return [
    { label: "Completed", value: completed },
    { label: "Overdue", value: overdue },
    { label: "Upcoming", value: upcoming },
  ];
}

/** Lead count by source - the "Lead Sources" chart. */
export async function getLeadSourcesChart(viewer: SalesCrmViewer): Promise<ChartPoint[]> {
  const leads = await prisma.salesLead.groupBy({
    by: ["source"],
    where: leadWhere(viewer),
    _count: { source: true },
  });

  return leads
    .map((row) => ({ label: SALES_LEAD_SOURCE_LABEL[row.source], value: row._count.source }))
    .sort((a, b) => b.value - a.value);
}
