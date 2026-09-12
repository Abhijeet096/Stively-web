import "server-only";

import { prisma } from "@/lib/prisma";
import type { ChartPoint } from "@/features/sales-crm/server/dashboard-charts";

/**
 * The course/digital-product sales dashboard's data layer - reads `Order`
 * and `OfferingEnrollment` directly rather than anything in
 * `features/sales-crm` (that's the separate B2B lead/project/commission
 * pipeline; it has never touched a student purchase and shouldn't start
 * here). Reuses `ChartPoint`/`SalesBarChart` from sales-crm since those two
 * are generic (label/value), not B2B-specific.
 */

export interface CourseSalesOverviewStats {
  /** All paise, all-time unless noted. */
  totalRevenue: number;
  monthlyRevenue: number;
  totalPaidOrders: number;
  /** Distinct buyers with at least one PAID order - a guest-checkout order always gets a userId backfilled once paid (see guest-fulfillment.ts), so this is a real headcount, not just registered accounts. */
  totalStudents: number;
  refundedOrders: number;
  averageOrderValue: number;
}

export async function getCourseSalesStats(): Promise<CourseSalesOverviewStats> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [revenueAgg, monthlyAgg, refundedOrders, distinctStudents] = await Promise.all([
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
    prisma.order.aggregate({ where: { status: "PAID", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.order.count({ where: { status: "REFUNDED" } }),
    prisma.order.findMany({ where: { status: "PAID", userId: { not: null } }, select: { userId: true }, distinct: ["userId"] }),
  ]);

  const totalRevenue = revenueAgg._sum.amount ?? 0;
  const totalPaidOrders = revenueAgg._count;

  return {
    totalRevenue,
    monthlyRevenue: monthlyAgg._sum.amount ?? 0,
    totalPaidOrders,
    totalStudents: distinctStudents.length,
    refundedOrders,
    averageOrderValue: totalPaidOrders > 0 ? Math.round(totalRevenue / totalPaidOrders) : 0,
  };
}

/** Revenue per month (paise), oldest to newest - same bucketing convention as sales-crm's getRevenueChart, applied to real Order rows instead. */
export async function getMonthlyRevenueChart(months = 6): Promise<ChartPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { status: "PAID", paidAt: { gte: since } },
    select: { paidAt: true, amount: true },
  });

  const buckets = new Map<string, number>();
  const labels = new Map<string, string>();
  for (let i = 0; i < months; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets.set(key, 0);
    labels.set(key, d.toLocaleDateString("en-IN", { month: "short" }));
  }
  for (const order of orders) {
    if (!order.paidAt) continue;
    const key = `${order.paidAt.getFullYear()}-${order.paidAt.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + order.amount);
  }

  return [...buckets.entries()].map(([key, value]) => ({ label: labels.get(key)!, value }));
}

export interface OfferingSalesRow {
  offeringId: string;
  title: string;
  slug: string;
  category: string;
  revenue: number;
  unitsSold: number;
  activeEnrollments: number;
  completedEnrollments: number;
}

/** Every offering with at least one paid order, revenue-sorted - the "what's actually selling" table. */
export async function getOfferingSalesBreakdown(): Promise<OfferingSalesRow[]> {
  const grouped = await prisma.order.groupBy({
    by: ["offeringId"],
    where: { status: "PAID" },
    _sum: { amount: true },
    _count: true,
  });
  if (grouped.length === 0) return [];

  const offeringIds = grouped.map((g) => g.offeringId);
  const [offerings, enrollmentCounts] = await Promise.all([
    prisma.offering.findMany({ where: { id: { in: offeringIds } }, select: { id: true, title: true, slug: true, category: true } }),
    prisma.offeringEnrollment.groupBy({ by: ["offeringId", "status"], where: { offeringId: { in: offeringIds } }, _count: true }),
  ]);

  const offeringById = new Map(offerings.map((o) => [o.id, o]));
  const enrollmentMap = new Map<string, { active: number; completed: number }>();
  for (const row of enrollmentCounts) {
    const entry = enrollmentMap.get(row.offeringId) ?? { active: 0, completed: 0 };
    if (row.status === "ACTIVE") entry.active += row._count;
    if (row.status === "COMPLETED") entry.completed += row._count;
    enrollmentMap.set(row.offeringId, entry);
  }

  return grouped
    .map((g) => {
      const offering = offeringById.get(g.offeringId);
      // DIGITAL_PRODUCT never has real enrollments by design (see
      // guest-fulfillment.ts's isDigitalProduct guard) - reading this off
      // the offering's own category, rather than trusting whatever
      // OfferingEnrollment rows happen to exist, keeps this correct even
      // against a stray leftover row from an older code path (one real
      // order predates that guard).
      const enrollment =
        offering?.category === "DIGITAL_PRODUCT" ? { active: 0, completed: 0 } : (enrollmentMap.get(g.offeringId) ?? { active: 0, completed: 0 });
      return {
        offeringId: g.offeringId,
        title: offering?.title ?? "Unknown offering",
        slug: offering?.slug ?? "",
        category: offering?.category ?? "",
        revenue: g._sum.amount ?? 0,
        unitsSold: g._count,
        activeEnrollments: enrollment.active,
        completedEnrollments: enrollment.completed,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export interface RecentOrderRow {
  id: string;
  sequence: number;
  offeringTitle: string;
  offeringId: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
}

/** Most recent real transactions (paid or refunded) across every offering - the "what just happened" feed. */
export async function getRecentOrders(limit = 10): Promise<RecentOrderRow[]> {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PAID", "REFUNDED"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { offering: { select: { id: true, title: true } }, user: { select: { name: true, email: true } } },
  });

  return orders.map((o) => ({
    id: o.id,
    sequence: o.sequence,
    offeringTitle: o.offering.title,
    offeringId: o.offering.id,
    buyerName: o.user?.name ?? o.guestName ?? "Guest",
    buyerEmail: o.user?.email ?? o.guestEmail ?? "-",
    amount: o.amount,
    status: o.status,
    paidAt: o.paidAt,
    createdAt: o.createdAt,
  }));
}

export interface StudentPurchaseRow {
  orderId: string;
  name: string;
  email: string;
  amount: number;
  orderStatus: string;
  paidAt: Date | null;
  enrollmentStatus: string | null;
  progressPercentage: number | null;
  certificateIssued: boolean;
  certificateNumber: string | null;
}

export interface OfferingSalesDetail {
  offering: { id: string; title: string; slug: string; category: string; price: number | null; currency: string };
  /** Whether this offering is enrollment/progress/certificate-bearing at all - derived from its own category, never from whether an OfferingEnrollment row happens to exist (a DIGITAL_PRODUCT should never show progress/certificate columns, even against a stray leftover enrollment row from before guest-fulfillment.ts's isDigitalProduct guard existed). */
  isCourse: boolean;
  stats: { revenue: number; unitsSold: number; refunds: number; activeEnrollments: number; completedEnrollments: number };
  students: StudentPurchaseRow[];
}

/** The "who bought this course/product, and where are they now" view - one offering, every real buyer. */
export async function getOfferingSalesDetail(offeringId: string): Promise<OfferingSalesDetail | null> {
  const offering = await prisma.offering.findUnique({
    where: { id: offeringId },
    select: { id: true, title: true, slug: true, category: true, price: true, currency: true },
  });
  if (!offering) return null;

  const isCourse = offering.category !== "DIGITAL_PRODUCT";

  const orders = await prisma.order.findMany({
    where: { offeringId, status: { in: ["PAID", "REFUNDED"] } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      enrollment: { include: { certificate: { select: { certificateNumber: true, status: true } } } },
    },
  });

  const paidOrders = orders.filter((o) => o.status === "PAID");
  const revenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const refunds = orders.length - paidOrders.length;
  const activeEnrollments = isCourse ? orders.filter((o) => o.enrollment?.status === "ACTIVE").length : 0;
  const completedEnrollments = isCourse ? orders.filter((o) => o.enrollment?.status === "COMPLETED").length : 0;

  const students: StudentPurchaseRow[] = orders.map((o) => ({
    orderId: o.id,
    name: o.user?.name ?? o.guestName ?? "Guest",
    email: o.user?.email ?? o.guestEmail ?? "-",
    amount: o.amount,
    orderStatus: o.status,
    paidAt: o.paidAt,
    enrollmentStatus: isCourse ? (o.enrollment?.status ?? null) : null,
    progressPercentage: isCourse ? (o.enrollment?.progressPercentage ?? null) : null,
    certificateIssued: isCourse && o.enrollment?.certificate?.status === "ISSUED",
    certificateNumber: isCourse ? (o.enrollment?.certificate?.certificateNumber ?? null) : null,
  }));

  return {
    offering,
    isCourse,
    stats: { revenue, unitsSold: paidOrders.length, refunds, activeEnrollments, completedEnrollments },
    students,
  };
}
