import type { Metadata } from "next";
import Link from "next/link";
import { IndianRupee, Wallet, Users, ShoppingCart, Undo2, Receipt, ChevronRight } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { formatPrice } from "@/lib/utils";
import { CATEGORY_LABEL } from "@/features/offerings/lib/labels";
import { SalesBarChart } from "@/features/sales-crm/components/shared/sales-bar-chart";
import {
  getCourseSalesStats,
  getMonthlyRevenueChart,
  getOfferingSalesBreakdown,
  getRecentOrders,
} from "@/features/course-sales/server/queries";

export const metadata: Metadata = { title: "Sales" };

function StatTile({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex flex-row items-center gap-4">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
          <p className="text-foreground text-2xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

/**
 * Course & Digital Product Sales - real Order/OfferingEnrollment data, not
 * the B2B Sales CRM (that's leads/quotes/projects, a completely separate
 * pipeline that has never touched a student purchase). Replaces the old
 * dead "Reports are coming soon" placeholder - see ARCHITECTURE_DECISIONS.md
 * for why this was built now, under the active freeze.
 */
export default async function SalesReportsPage() {
  const [stats, monthlyRevenue, breakdown, recentOrders] = await Promise.all([
    getCourseSalesStats(),
    getMonthlyRevenueChart(),
    getOfferingSalesBreakdown(),
    getRecentOrders(10),
  ]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Sales</h1>
        <p className="text-muted-foreground text-sm">Real revenue and enrollment data across every course and digital product.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Total Revenue" value={formatPrice(stats.totalRevenue)} icon={IndianRupee} />
        <StatTile label="This Month" value={formatPrice(stats.monthlyRevenue)} icon={Wallet} />
        <StatTile label="Paid Orders" value={stats.totalPaidOrders} icon={ShoppingCart} />
        <StatTile label="Students" value={stats.totalStudents} icon={Users} />
        <StatTile label="Avg. Order Value" value={formatPrice(stats.averageOrderValue)} icon={Receipt} />
        <StatTile label="Refunds" value={stats.refundedOrders} icon={Undo2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesBarChart data={monthlyRevenue} emptyLabel="No revenue recorded in the last 6 months yet." formatValue={(v) => formatPrice(v)} />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-foreground text-lg font-semibold tracking-tight">Courses & Products</h2>
        {breakdown.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No sales yet" description="Paid courses and digital products will show up here." />
        ) : (
          <div className="border-border overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Offering</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Units Sold</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {breakdown.map((row) => (
                  <tr key={row.offeringId}>
                    <td className="text-foreground px-4 py-3 font-medium">{row.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{CATEGORY_LABEL[row.category as keyof typeof CATEGORY_LABEL] ?? row.category}</Badge>
                    </td>
                    <td className="text-foreground px-4 py-3 font-medium tabular-nums">{formatPrice(row.revenue)}</td>
                    <td className="text-foreground px-4 py-3 tabular-nums">{row.unitsSold}</td>
                    <td className="text-foreground px-4 py-3 tabular-nums">{row.activeEnrollments || "-"}</td>
                    <td className="text-foreground px-4 py-3 tabular-nums">{row.completedEnrollments || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/reports/${row.offeringId}`}
                        className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                      >
                        View students
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-foreground text-lg font-semibold tracking-tight">Recent orders</h2>
        {recentOrders.length === 0 ? (
          <EmptyState icon={Receipt} title="No orders yet" description="Real transactions will show up here as they happen." />
        ) : (
          <div className="border-border overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Offering</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">{order.buyerName}</span>
                        <span className="text-muted-foreground text-xs">{order.buyerEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/reports/${order.offeringId}`} className="text-primary hover:underline">
                        {order.offeringTitle}
                      </Link>
                    </td>
                    <td className="text-foreground px-4 py-3 font-medium tabular-nums">{formatPrice(order.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={order.status === "REFUNDED" ? "destructive" : "success"}>{order.status}</Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">{formatDate(order.paidAt ?? order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
